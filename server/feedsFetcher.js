const {readFileSync, writeFileSync} = require('fs');
const {FEEDS} = require("../src/Config");
const {FeedParser, ellipsize} = require("../src/eutils/FeedParser");

const OUTPUT_ACCUMULATOR_FILE = 'feed.json';

const readJsonFile = (fileName) => {
  try {
    let data = readFileSync(fileName, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.log('readJsonFile error: ' + e);
    return {};
  }
};

const writeJsonFile = (fileName, jsonObject) => writeFileSync(fileName, JSON.stringify(jsonObject, null, 1), 'utf8');

const Accumulator = readJsonFile(OUTPUT_ACCUMULATOR_FILE);

function processNextFeed() {
  const spec = FEEDS.shift();
  if (!spec) {
    doneWithAllFeeds();
    return;
  }
  if (spec.disabled) {
    console.log('skipping (disabled in Config.js): ' + spec.company + ' (' + spec.id + ')');
    return processNextFeed();
  }
  console.log('fetching ' + spec.company + ' (' + spec.id + ')');
  FeedParser.parseWebFeed(spec.url, false, (err, feed) => {
    console.log('  ..' + spec.company + (err ? ' ERROR' : ' ok'));
    if (!err) {
      // shrink the descriptions, for size protection
      feed.posts.forEach(post => post.description = ellipsize(post.description, 800));
      // add to feed: fetch date
      feed.fetchDate = Date.now();
      // overwrite the static global contents for this feed
      Accumulator[spec.id] = feed;
    } else {
      console.error("Error while fetching " + spec.name + ", on: " + spec.url);
      console.log(spec);
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
  console.log('Writing ' + OUTPUT_ACCUMULATOR_FILE);
  writeJsonFile(OUTPUT_ACCUMULATOR_FILE, Accumulator);

  // out: posts list
  // console.log('Writing posts.json, with ' + posts.length + ' posts');
  // writeJsonFile('posts.json', posts);
}

processNextFeed();
