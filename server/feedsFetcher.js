import {readFileSync, writeFileSync} from 'fs';
import {FEEDS} from "../src/Feeds";
import FeedParser, {ellipsize} from "../src/FeedParser";

const readJsonFile = (fileName) => {
  try {
    let data = readFileSync(fileName, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.log('readJsonFile error: ' + e);
    return {};
  }
};

const writeJsonFile = (fileName, jsonObject) => writeFileSync(fileName, JSON.stringify(jsonObject/*, null, 2*/), 'utf8');

const Accumulator = readJsonFile('accumulator.json');

function processNextFeed() {
  const spec = FEEDS.shift();
  if (!spec) {
    doneWithAllFeeds();
    return;
  }
  console.log('fetching ' + spec.company);
  FeedParser.loadAndParse(spec.url, false, (err, feed) => {
    console.log('  ..' + spec.company + (err ? ' ERROR' : ' ok'));
    if (!err) {
      // shrink the descriptions, for size protection
      feed.posts.forEach(post => post.description = ellipsize(post.description, 800));
      // add to feed: spec data and fetch date
      feed.spec = spec;
      feed.fetchDate = Date.now();
      // overwrite the static global contents for this feed
      Accumulator[spec.id] = feed;
    } else {
      console.error("Error while fetching " + spec.name + ", on: " + spec.url);
      console.log(err);
    }
    // proceed with the next fetch
    processNextFeed();
  });
}

function doneWithAllFeeds() {
  // re-make the full posts list
  let posts = [];
  Object.keys(Accumulator).map(feedId => Accumulator[feedId]).forEach(feed => posts = posts.concat(feed.posts));

  // sort posts by time
  posts.sort((a, b) => b.date - a.date);

  // out: accumulator
  console.log('Writing accumulator.json');
  writeJsonFile('accumulator.json', Accumulator);

  // out: posts list
  // console.log('Writing posts.json, with ' + posts.length + ' posts');
  // writeJsonFile('posts.json', posts);
}

processNextFeed();
