import request from "request";
import xml2js from "xml2js";

const v = (container, key) => {
  const value = container[key];
  if (typeof value === "undefined" || value === null)
    return '';
  if (Array.isArray(value)) {
    if (value.length > 1)
      console.error('FeedParser: missing ' + (value.length - 1) + ' values from property: ' + key);
    return value[0];
  }
  return value;
};

const atomHtmlString = (str) => {
  if (typeof str === "object") {
    const strType = v(str, 'type');
    if (strType !== "html" && strType !== "text")
      console.error('FeedParser: Atom type is not html/text, but ' + v(str, 'type'));
    return str['_'];
  }
  return str;
};

const atomFindHtmlUrl = (atomUrls) => {
  if (Array.isArray(atomUrls)) {
    let index = 0;
    for (let i = 0; i < atomUrls.length; ++i) {
      const atomUrl = atomUrls[i];
      const urlType = v(atomUrl, 'type');
      if (urlType === "text/html")
        index = i;
    }
    const atomUrl = atomUrls[index];
    return v(atomUrl, 'href');
  }
  return atomUrls;
};

const ellipsize = (str, len) => str.length > len ? str.substr(0, len - 2) + "…" : str;

const removeHtmlTags = (summary) => summary
  .replace(/<\/?[^>]+(>|$)/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&#8217;/g, "'")
  .replace(/&#8230;/g, "…")
  .replace(/&#8220;/g, "\"")
  .replace(/&#8221;/g, "\"")
  .replace(/&amp;/g, "&")
  .replace(/&reg;/g, '®');

const parseDate = (dateStr) => {
  let date = Date.parse(dateStr);
  if (isNaN(date)) {
    console.error('FeedParser: error parsing date: ' + dateStr);
    return null;
  }
  return date;
};

const stringHash = (str) => {
  if (str.length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    let chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const hashForPost = (p) => stringHash(p.url.length ? p.url : p.title + p.date);

const FeedParser = {

  deCORS: url => "https://services.enricoros.com/de-cors.php?csurl=" + encodeURIComponent(url),

  loadAndParse: (url, callback) => {
    request({
      url: FeedParser.deCORS(url),
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.19 Safari/537.36'
        // accept: 'text/html,application/xhtml+xml'
      },
      pool: false,
      followRedirect: true
    }, (error, response, xmlData) => {
      if (error || !response || response.statusCode !== 200) {
        console.log(response);
        callback('Fetch error from url: ' + url, null);
        return;
      }
      const P = new xml2js.Parser({trim: false, normalize: true, mergeAttrs: true});
      P.addListener("error", (err) => callback(err, null));
      P.parseString(xmlData, (err, jsonData) => {
        if (err || !jsonData)
          callback('Error parsing data from: ' + url, null);
        else if (jsonData.hasOwnProperty('rss'))
          callback(null, FeedParser.parseRss(jsonData['rss'], url));
        else if (jsonData.hasOwnProperty('feed'))
          callback(null, FeedParser.parseFeed(jsonData['feed'], url));
        else
          callback('Format unsupported for: ' + url, null);
      });
    });
  },

  parseRss: (jsonRss, url) => {
    //console.log(jsonRss);
    const channel = v(jsonRss, 'channel');
    const feed = {
      title: v(channel, 'title'),
      description: v(channel, 'description'),
      url: v(channel, 'link'),
      posts: [],
      _debug_source: channel
    };
    FeedParser.findUnknownKeys(channel, [
      /* parsed */ 'title', 'description', 'link', 'item',
      /* ignored */ 'language', 'generator', 'atom:link', 'lastBuildDate', 'sy:updatePeriod',
      'sy:updateFrequency', 'ttl', 'pubDate', 'image', 'webMaster'
    ], url);
    for (let val of [].concat(channel.item)) {
      const item = {
        title: v(val, 'title'),
        description: removeHtmlTags(v(val, 'description')),
        url: v(val, 'link'),
        date: parseDate(v(val, 'pubDate')),
        hash: undefined,
        _author: v(val, 'dc:creator'),
        _id: v(val, 'guid')['_'],
        _thumbUrl: v(v(val, 'media:content'), 'url'),
        _debug_source: val
      };
      FeedParser.findUnknownKeys(val, [
        /* parsed */ 'title', 'description', 'link', 'pubDate', 'guid', 'media:content',
        /* skipped */ 'category', 'dc:creator', 'content:encoded', 'comments', 'wfw:commentRss', 'slash:comments', 'atom:updated'
      ], url);
      item.hash = hashForPost(item);
      feed.posts.push(item);
    }
    delete feed._debug_source['item'];
    return feed;
  },

  findUnknownKeys(obj, known_keys, debugUrl) {
    // print unsupported properties, as a promise for better parsing
    for (let key of Object.keys(obj))
      if (known_keys.indexOf(key) === -1)
        console.log('FeedParser: non-parsed property \'' + key + ' = ' + JSON.stringify(obj[key]) + ', on: ' + debugUrl);
  },

  parseFeed: (jsonFeed, url) => {
    // console.log(jsonFeed);
    const feed = {
      title: atomHtmlString(v(jsonFeed, 'title')),
      description: atomHtmlString(v(jsonFeed, 'subtitle')),
      url: url,
      posts: [],
      _debug_source: jsonFeed
    };
    FeedParser.findUnknownKeys(jsonFeed, [
      /* parsed */ 'title', 'subtitle', 'entry',
      /* skipped */ 'author', 'category', 'generator', 'id', 'link', 'updated', 'openSearch:itemsPerPage',
      'openSearch:startIndex', 'openSearch:totalResults', 'xmlns', 'xmlns:openSearch', 'xmlns:gd',
      'xmlns:georss', 'xmlns:blogger', 'xmlns:thr',
      /* skipped youtube */ 'xmlns:yt', 'xmlns:media', 'yt:channelId', 'published'
    ], url);
    for (let val of [].concat(jsonFeed.entry)) {
      const valContent = v(val, 'content');
      const item = {
        title: atomHtmlString(v(val, 'title')),
        description: removeHtmlTags(atomHtmlString(v(val, 'summary') || valContent)),
        url: atomFindHtmlUrl(val['link']),
        date: parseDate(v(val, 'published')),
        hash: undefined,
        _author: v(v(val, 'author'), 'name'),
        _id: v(val, 'id'),
        _thumbUrl: v(v(val, 'media:thumbnail'), 'url'),
        _debug_source: val
      };
      // patch for Blogger's "content" and "author" melting
      if (item.description.startsWith('Posted by ') && valContent['_'].startsWith('<span ')) {
        let contentHtml = valContent['_'];
        const authorEndIdx = contentHtml.indexOf('</span>') + 7;
        const authorHtml = contentHtml.substr(0, authorEndIdx);
        contentHtml = contentHtml.substr(authorEndIdx);
        item._author = removeHtmlTags(authorHtml).replace('Posted by ', '');
        item.description = removeHtmlTags(contentHtml);
      }
      // patch content with media:group
      if (val.hasOwnProperty('media:group')) {
        let valMediaGroup = v(val, 'media:group');
        if (item.description === "")
          item.description = ellipsize(removeHtmlTags(v(valMediaGroup, 'media:description')), 90);
        if (item._thumbUrl === "")
          item._thumbUrl = v(v(valMediaGroup, 'media:thumbnail'), 'url');
      }
      // patch for YouTube to get the Video ID
      if (val.hasOwnProperty('yt:videoId'))
        item._ytVideoId = v(val, 'yt:videoId');
      FeedParser.findUnknownKeys(val, [
        /* parsed */ 'title', 'link', 'published', 'summary', 'content', 'author', 'media:thumbnail',
        /* parsed youtube */ 'media:group',
        /* skipped */ 'id', 'category', 'updated', 'gd:extendedProperty', 'thr:total',
        /* skipped youtube */ 'yt:videoId', 'yt:channelId'
      ], url);
      item.hash = hashForPost(item);
      feed.posts.push(item);
    }
    delete feed._debug_source['entry'];
    return feed;
  },
};

export {ellipsize};
export default FeedParser;
