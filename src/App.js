import "bootstrap/dist/css/bootstrap.css";
import "react-notifications/lib/notifications.css";
import "./App.css";

import React, {Component} from "react";
import {Button, Col, Row} from "react-bootstrap";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import YouTube from "react-youtube";
import request from "request";

import {FEEDS, LOGO_FILES} from "./Config";
import FeedParser, {ellipsize} from "./eutils/FeedParser";
import {NNArt} from "./nn/NNArt";

const colorize = (snippet, color) => <span style={{color: color}}>{snippet}</span>;

const humanDate = (dateTS) => {
  const date = new Date(dateTS);
  const elapsed = Date.now() - dateTS;
  if (elapsed < 10 * 60 * 1000)
    return colorize('just now.', 'darkgreen');
  if (elapsed < 90 * 60 * 1000)
    return colorize('one hour ago.', 'darkgreen');
  if (elapsed < 8 * 3600 * 1000)
    return colorize('few hours ago.', 'darkgreen');
  if (elapsed < 1.2 * 24 * 3600 * 1000)
    return colorize('today.', 'darkgreen');
  if (elapsed < 2.5 * 24 * 3600 * 1000)
    return 'yesterday.';
  let prefix = 'on ';
  if (elapsed < 7 * 24 * 3600 * 1000)
    prefix = 'this week, on ';
  else if (elapsed < 14 * 24 * 3600 * 1000)
    prefix = 'last week, on ';
  return prefix + date.toLocaleDateString().replace('/2020', ''); //.replace('/', ' / ');
};

const YouTubeOpts = {
  width: "380",
  height: "285",
  playerVars: {
    controls: 1,
    rel: 0,
    showinfo: 0,
  }
};

class YouTubeWrapper extends Component {
  // NOTE: this could use state for having an immediate display of the player, without reloading
  static onToggle(e, nextState) {
    e.preventDefault();
    localStorage.setItem('disable_youtube_player', nextState); // inherit globally
    window.location.reload();
  }

  render() {
    const isDisabled = localStorage.getItem('disable_youtube_player') === 'true';
    if (isDisabled)
      return <div><Button onClick={(e) => YouTubeWrapper.onToggle(e, false)}> ► Enable YouTube</Button></div>;
    return (
      <div className="clearfix">
        <YouTube videoId={this.props.videoId} opts={YouTubeOpts}/>
        <br/>
        <Button onClick={(e) => YouTubeWrapper.onToggle(e, true)}>Disable YouTube.</Button>
      </div>
    );
  }
}

const Post = ({post}) =>
  <div className="Post">
    {post.newOnScreen && <div className="NewOnScreen"/>}
    <h2><span className="Prefix">{post.feed.spec.title_prefix}</span> <a href={post.url}>{post.title}</a></h2>
    <div className="Content">
      <p>
        {!post._ytVideoId && <span className='Company'>
          {/*post.feed.spec.company*/ /* Company Logo on the left */}
          <img src={LOGO_FILES[post.feed.spec.company]} onClick={() => console.log(post)}
               alt={post.feed.spec.company + ' logo'}/>
        </span>}
        {post._thumbUrl && <span className="Thumbnail">
          <img src={post._thumbUrl} alt="Thumbnail"/>
        </span>}
        <span>{ellipsize(post.description || post.title, 800)}</span>
      </p>
      {post._ytVideoId && <YouTubeWrapper videoId={post._ytVideoId}/>}
      <div className="Footer">
        <Row>
          <Col sm={7} style={{textAlign: 'left'}}>- {post.author || post.feed.title}, {humanDate(post.date)}</Col>
          <Col sm={5} style={{textAlign: 'right'}}><a href={post.feed.spec.home}>➥ {post.feed.spec.name}</a></Col>
        </Row>
      </div>
    </div>
  </div>;

const Separator = ({title}) => <div className="Separator">{title && <span>{title}</span>}</div>;

const MIN_POSTS = 5;

class FeedPosts extends Component {
  render() {
    // keep the following 2 in sync with 'humanDate'
    const today = Date.now() - 1.4 * 24 * 3600 * 1000;
    const yesterday = Date.now() - 2.5 * 24 * 3600 * 1000;
    // filter by company
    let filteredPosts = this.props.posts.filter(p => this.props.filterByCompany ? p.feed.spec.company === this.props.filterByCompany : true);
    // filter by recent (or at least 4 messages)
    let filteredMessage = "";
    if (!filteredPosts.length) {
      filteredMessage = "Nothing to read yet.";
    } else {
      const recentEnough = Date.now() - 4 * 7 * 24 * 3600 * 1000;
      filteredPosts = filteredPosts.filter((p, idx) => p.date > recentEnough || idx < MIN_POSTS);
      if (filteredPosts.length <= MIN_POSTS)
        filteredMessage = "Only showing the last " + filteredPosts.length + " news.";
      else
        filteredMessage = "Only showing up to 4 weeks.";
      filteredMessage += " Everything else is old.";
    }
    // set the post attribute to signal it's shown for the first time (imperfect but optimized way of doing it)
    filteredPosts.forEach(p => p.newOnScreen = p.date >= this.props.lastRefreshDate);
    // separate Today's from formers messages
    const todayPosts = filteredPosts.filter(p => p.date >= today);
    const yesterdayPosts = filteredPosts.filter(p => p.date < today && p.date >= yesterday);
    const afterPosts = filteredPosts.filter(p => p.date < yesterday);
    return <div>
      {todayPosts.length > 0 && <div>{todayPosts.map(p => <Post post={p} key={p.hash}/>)}</div>}
      {(todayPosts.length > 0 && yesterdayPosts.length > 0) &&
      <div><h3>&nbsp;</h3><Separator title="Yesterday"/><h3>&nbsp;</h3></div>}
      {yesterdayPosts.length > 0 && <div>{yesterdayPosts.map(p => <Post post={p} key={p.hash}/>)}</div>}
      {(afterPosts.length > 0 && afterPosts.length !== filteredPosts.length) &&
      <div><h3>&nbsp;</h3><Separator title="Earlier"/><h3>&nbsp;</h3></div>}
      {afterPosts.length > 0 && <div>{afterPosts.map(p => <Post post={p} key={p.hash}/>)}</div>}
      {/*{filteredPosts.length > 0 && <hr/>}*/}
      <div className="Post TheEnd">
        <h3>&nbsp;</h3>
        <h3>{filteredMessage}</h3>
        <h3>Enjoy</h3>
        <h3>&nbsp;</h3>
      </div>
    </div>
  }
}

class HeaderTitle extends Component {
  render() { /*🎤🤖*/
    return <span onClick={() => window.location.href = '/'}
                 style={{cursor: 'pointer'}}>Machine Learning Leaders News</span>;
  }
}

const Header = ({onRefreshClick, scale, onScaleChange, onFeedChange}) =>
  <div className="App-header">
    <div className="container">
      <h2>
        <Row>
          <Col sm={8} className="d-none d-md-block">
            <HeaderTitle/>
          </Col>
          <Col sm={8} className="d-block d-lg-none">
            ML Leaders Voice
          </Col>
          <Col sm={4} className="App-header-right d-none d-sm-block">
            <Button onClick={onScaleChange} className="btn-transparent">{scale}</Button>
            {/*<Button onClick={onFeedChange} className="btn-transparent">Feeds</Button>*/}
            <Button onClick={onRefreshClick} variant="primary">Refresh</Button>
          </Col>
        </Row>
      </h2>
    </div>
  </div>;

const Footer = () =>
  <div className="App-footer-container">
    <div className="container App-footer">
      <p className="Tagline">
        Coffee and AI news in the morning, what a powerful routine to kickstart your day.
      </p>
      <br/>
      <p>
        This curated AI News RSS aggregator has been made with the freshest ingredients,<br/>
        including <a href="https://pair-code.github.io/deeplearnjs/"><i>deeplearn.js</i></a> and <a
        href="https://facebook.github.io/react/"><i>React</i></a> and ❤.
      </p>
      <p>
        Sorry for not having ads, but they're annoying.<br/>
        More tools for you, ML/AI lover, will come soon.
      </p>
      <br/>
      <p className="Author">
        Enrico Ros, {new Date().getFullYear().toString()}
      </p>
    </div>
  </div>;

const LogoList = ({filterCompany, onCompanyFilter}) =>
  <div className="LogoList">
    {Object.keys(LOGO_FILES).sort().map(company_name => {
      const company_feed = FEEDS.find(feed => feed.company === company_name);
      if (company_feed && company_feed.disabled) return null;
      return (<img src={LOGO_FILES[company_name]} key={company_name} alt={company_name} data-company_name={company_name}
                  onMouseEnter={e => onCompanyFilter(company_name, false)}
                  onMouseLeave={e => onCompanyFilter(null, false)}
                  onClick={e => onCompanyFilter(company_name, true)}
                  className={filterCompany === company_name ? 'active' : ''}/>);
    })}
  </div>;

// To be added later, when we talk about Routes in this app
// const NewsFeedApp = (props) => <div/>;

// set this to true to fetch all the individual streams from the client, instead of the pre-processed aggregated feeds
const USE_CLIENT_FETCHING = false;
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

class App extends Component {
  ActiveFeeds = {};
  state = {
    errors: [],
    filterByCompany: null,
    filterSticky: false,
    posts: [],
    scale: 'Large',
    lastRefreshDate: Date.now()
  };
  isFirstRefresh = true;

  componentDidMount() {
    this.onRefreshClicked();
    this.timerID = setInterval(() => this.onRefreshClicked(), REFRESH_INTERVAL);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  onRefreshClicked() {
    // get the last refresh date and set it to current - this will be used to highlight new posts
    this.setState({lastRefreshDate: parseInt(localStorage.getItem('last_refresh_date') || Date.now())});
    localStorage.setItem('last_refresh_date', Date.now());

    // use the right kind of fetching, with the right level of completeness
    const allowAll = window.location.search.indexOf('enrico') !== -1;
    if (USE_CLIENT_FETCHING)
      this.updateAllWithClientFetching(allowAll);
    else
      this.updateAllWithServerFeed(allowAll);
  }

  static handleError(message, exception) {
    console.error(message);
    if (exception)
      console.log(exception);
    NotificationManager.error(message);
  }

  updateAllWithServerFeed(ignoreDisabled) {
    const RELATIVE_GENERATED_FEED_PATH = 'feed.json';
    const options = {
      url: window.location.origin + '/' + RELATIVE_GENERATED_FEED_PATH,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.19 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      followRedirect: true
    };
    request(options, (error, response, data) => {
      if (error || !response || response.statusCode !== 200) {
        App.handleError('Error fetching the aggregated feed', error);
        return;
      }
      const processedFeeds = JSON.parse(data);
      FEEDS.filter(spec => !spec.disabled || ignoreDisabled).forEach(spec => {
        const feed = processedFeeds[spec.id];
        if (feed)
          this.shallowMergeFeed(feed, spec);
        else
          App.handleError('The aggregated feed is missing ' + spec.id);
      });
      this.updatePostsList();
      this.showRefreshPopup();
    });
  }

  showRefreshPopup() {
    // show the Refresh notification, using the server-side Fetch dates
    const refreshDates = Object.values(this.ActiveFeeds).map(feed => feed.fetchDate).sort();
    if (this.isFirstRefresh || refreshDates.length < 1) {
      this.isFirstRefresh = false;
      return;
    }
    const now = Date.now();
    const newerMin = Math.round((now - Math.max.apply(null, refreshDates)) / 1000 / 60);
    let msg = "Refreshed ";
    if (newerMin < 1)
      msg += 'less than a minute';
    else if (newerMin === 1)
      msg += '1 minute';
    else if (newerMin < 90)
      msg += newerMin + ' minutes';
    else
      msg += Math.round(newerMin / 60) + ' hours';
    msg += ' ago.';
    const olderDeltaMin = newerMin - Math.round((now - Math.min.apply(null, refreshDates)) / 1000 / 60);
    if (olderDeltaMin > 10)
      msg += " One feed hasn't been updated for " + olderDeltaMin + " minutes.";
    NotificationManager.info(msg, 'Refreshed', 4000);
  }

  updateAllWithClientFetching(ignoreDisabled) {
    FEEDS.filter(spec => !spec.disabled || ignoreDisabled).forEach(spec => FeedParser.parseWebFeed(spec.url, true, (err, feed) => {
      if (!err) {
        feed.fetchDate = Date.now();
        this.shallowMergeFeed(feed, spec);
        this.updatePostsList();
      } else
        App.handleError("Error while fetching " + spec.name + ", on: " + spec.url, err)
    }));
  }

  shallowMergeFeed(feed, spec) {
    // add the original spec to the new feed
    feed.spec = spec;
    // point every post to the containing feed, and to our internal feed DB entry
    feed.posts.forEach(post => post['feed'] = feed);
    // update the static global contents for this feed
    this.ActiveFeeds[spec.id] = feed;
  }

  updatePostsList() {
    // re-make the full posts list
    let posts = [];
    Object.keys(this.ActiveFeeds).map(feedId => this.ActiveFeeds[feedId]).forEach(feed => {
      posts = posts.concat(feed.posts);
    });
    // update the UI with sorted posts by time, newest on top
    this.setState({posts: posts.sort((a, b) => b.date - a.date)});
  }

  onScaleChange() {
    this.setState({
      scale: this.state.scale === 'Large' ? 'Small' : 'Large'
    });
  }

  onCompanyFilter(companyName, sticky) {
    if (sticky) {
      const disabling = this.state.filterSticky && this.state.filterByCompany === companyName;
      this.setState({
        filterByCompany: disabling ? null : companyName,
        filterSticky: !disabling
      });
    } else {
      const whileSticky = this.state.filterSticky;
      if (!whileSticky) {
        this.setState({
          filterByCompany: companyName
        });
      }
    }
  }

  render() {
    return (
      <div className={'App-' + this.state.scale}>
        <div className="App-header-container">
          <NNArt/>
          <Header scale={this.state.scale} onRefreshClick={this.onRefreshClicked.bind(this)}
                  onScaleChange={this.onScaleChange.bind(this)}/>
          {this.state.posts.length > 0 /* conditional render to yield to feed.json*/ &&
          <LogoList filterCompany={this.state.filterByCompany} onCompanyFilter={this.onCompanyFilter.bind(this)}/>}
        </div>
        <div className='container App-Body'>
          <FeedPosts posts={this.state.posts} filterByCompany={this.state.filterByCompany}
                     lastRefreshDate={this.state.lastRefreshDate}/>
        </div>
        <Footer/>
        <NotificationContainer/>
      </div>
    );
  }
}

export default App;
