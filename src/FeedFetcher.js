import request from "request";
import xml2js from "xml2js";

const v = (container, key) => {
  const value = container[key];
  if (typeof value === "undefined" || value === null)
    return '';
  if (Array.isArray(value)) {
    if (value.length > 1)
      console.error('FeedFetcher: missing ' + (value.length - 1) + ' values from property: ' + key);
    return value[0];
  }
  return value;
};

const atomHtmlString = (str) => {
  if (typeof str === "object") {
    const strType = v(str, 'type');
    if (strType !== "html" && strType !== "text")
      console.error('FeedFetcher: Atom type is not html/text, but ' + v(str, 'type'));
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

const removeHtmlTags = (summary) => summary.replace(/<\/?[^>]+(>|$)/g, "");

const parseDate = (dateStr) => {
  let date = Date.parse(dateStr);
  if (isNaN(date)) {
    console.error('FeedFetcher: error parsing date: ' + dateStr);
    return null;
  }
  return date;
};

const FeedFetcher = {

  deCORS: url => "https://services.enricoros.com/de-cors.php?csurl=" + encodeURIComponent(url),

  loadAndParse: (url, callback) => {
    request({
      url: FeedFetcher.deCORS(url),
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
          callback(null, FeedFetcher.parseRss(jsonData['rss'], url));
        else if (jsonData.hasOwnProperty('feed'))
          callback(null, FeedFetcher.parseFeed(jsonData['feed'], url));
        else
          callback('Format unsupported for: ' + url, null);
      });
    });
  },

  findUnknownKeys(obj, known_keys, debugUrl) {
    // print unsupported properties, as a promise for better parsing
    for (let key of Object.keys(obj))
      if (known_keys.indexOf(key) === -1)
        console.log('FeedFetcher: non-parsed property \'' + key + ' = ' + JSON.stringify(obj[key]) + ', on: ' + debugUrl);
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
    FeedFetcher.findUnknownKeys(channel, [
      /* parsed */ 'title', 'description', 'link', 'item',
      /* ignored */ 'language', 'generator', 'atom:link', 'lastBuildDate', 'sy:updatePeriod',
      'sy:updateFrequency', 'pubDate', 'image', 'webMaster'
    ], url);
    for (let val of [].concat(channel.item)) {
      const item = {
        title: v(val, 'title'),
        description: removeHtmlTags(v(val, 'description')),
        url: v(val, 'link'),
        date: parseDate(v(val, 'pubDate')),
        _author: v(val, 'dc:creator'),
        _id: v(val, 'guid')['_'],
        _thumbUrl: v(v(val, 'media:content'), 'url'),
        _debug_source: val
      };
      FeedFetcher.findUnknownKeys(val, [
        /* parsed */ 'title', 'description', 'link', 'pubDate', 'guid', 'media:content',
        /* skipped */ 'category', 'dc:creator', 'content:encoded', 'comments', 'wfw:commentRss', 'slash:comments', 'atom:updated'
      ], url);
      feed.posts.push(item);
    }
    delete feed._debug_source['item'];
    return feed;
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
    FeedFetcher.findUnknownKeys(jsonFeed, [
      /* parsed */ 'title', 'subtitle', 'entry',
      /* skipped */ 'author', 'category', 'generator', 'id', 'link', 'updated', 'openSearch:itemsPerPage',
      'openSearch:startIndex', 'openSearch:totalResults', 'xmlns', 'xmlns:openSearch', 'xmlns:gd',
      'xmlns:georss', 'xmlns:blogger', 'xmlns:thr'
    ], url);
    for (let val of [].concat(jsonFeed.entry)) {
      const valContent = v(val, 'content');
      const item = {
        title: atomHtmlString(v(val, 'title')),
        description: removeHtmlTags(atomHtmlString(v(val, 'summary') || valContent)),
        url: atomFindHtmlUrl(val['link']),
        date: parseDate(v(val, 'published')),
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
      FeedFetcher.findUnknownKeys(val, [
        /* parsed */ 'title', 'link', 'published', 'summary', 'content', 'author', 'media:thumbnail',
        /* skipped */ 'id', 'category', 'updated', 'gd:extendedProperty', 'thr:total'
      ], url);
      feed.posts.push(item);
    }
    delete feed._debug_source['entry'];
    return feed;
  },
};

export default FeedFetcher;
