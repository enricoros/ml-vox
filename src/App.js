import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";
import "./App.css";

import React, {Component} from "react";
import {Button, Clearfix, Col, Row} from "react-bootstrap";
import YouTube from "react-youtube";

import {FEEDS, LOGO_FILES} from "./Feeds";
import FeedParser, {ellipsize} from "./FeedParser";

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
  if (elapsed < 3 * 24 * 3600 * 1000)
    return 'yesterday.';
  let prefix = 'on ';
  if (elapsed < 7 * 24 * 3600 * 1000)
    prefix = 'this week, on ';
  else if (elapsed < 14 * 24 * 3600 * 1000)
    prefix = 'last week, on ';
  return prefix + date.toLocaleDateString().replace('/2017', '').replace('/', ' / ');
};

const YouTubeOpts = {
  playerVars: {
    controls: 1,
    rel: 0,
    showinfo: 0
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
      <div>
        <YouTube videoId={this.props.videoId} opts={YouTubeOpts}/>
        <br/>
        <a href="#" onClick={(e) => YouTubeWrapper.onToggle(e, true)}>Disable YouTube.</a>
      </div>
    );
  }
}

const Post = ({post}) =>
  <div className="Post">
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
      <Clearfix/>
      <div className="Footer">
        <Row>
          <Col md={8} style={{textAlign: 'left'}}>- {post._author || post.feed.title}, {humanDate(post.date)}</Col>
          <Col md={4} style={{textAlign: 'right'}}><a href={post.feed.spec.home}>- {post.feed.spec.name}</a></Col>
        </Row>
      </div>
    </div>
  </div>;

const Separator = ({title}) => <div className="Separator">{title && <span>{title}</span>}</div>;

class FeedPosts extends Component {
  render() {
    const today = Date.now() - 1.4 * 24 * 3600 * 1000;
    // filter by company
    let filteredPosts = this.props.posts.filter(p => this.props.filterByCompany ? p.feed.spec.company === this.props.filterByCompany : true);
    // filter by recent (or at least 4 messages)
    let filteredMessage = "";
    if (!filteredPosts.length) {
      filteredMessage = "Loading...";
    } else {
      const recentEnough = Date.now() - 4 * 7 * 24 * 3600 * 1000;
      filteredPosts = filteredPosts.filter((p, idx) => p.date > recentEnough || idx < 4);
      if (filteredPosts.length <= 4)
        filteredMessage = "Only showing the last " + filteredPosts.length + " news.";
      else
        filteredMessage = "Only showing up to 4 weeks.";
      filteredMessage += " Everything else is old.";
    }
    // separate Today's from formers messages
    const todayPosts = filteredPosts.filter(p => p.date >= today);
    const afterPosts = filteredPosts.filter(p => p.date < today);
    return <div>
      {todayPosts.length > 0 && <div>{todayPosts.map(p => <Post post={p} key={p.hash}/>)}</div>}
      {todayPosts.length > 0 && <div><h3>&nbsp;</h3><Separator title="Yesterday and earlier"/><h3>&nbsp;</h3></div>}
      {afterPosts.length > 0 && <div>{afterPosts.map(p => <Post post={p} key={p.hash}/>)}</div>}
      <hr/>
      <div className="Post TheEnd">
        <h3>&nbsp;</h3>
        <h3>{filteredMessage}</h3>
        <h3>Enjoy</h3>
        <h3>&nbsp;</h3>
      </div>
    </div>
  }
}

const Header = ({onRefreshClick, scale, onScaleChange, onFeedChange}) =>
  <div className="App-header">
    <div className="container">
      <h2>
        <Row>
          <Col sm={8} smHidden xsHidden>
            Machine Learning Leaders Voice
          </Col>
          <Col sm={8} mdHidden lgHidden>
            ML Leaders Voice
          </Col>
          <Col sm={4} className="App-header-right" xsHidden>
            <Button onClick={onScaleChange} className="btn-transparent">{scale}</Button>
            {/*<Button onClick={onFeedChange} className="btn-transparent">Feeds</Button>*/}
            <Button onClick={onRefreshClick} bsStyle="primary">Refresh</Button>
          </Col>
        </Row>
      </h2>
    </div>
  </div>;

const LogoList = ({filterCompany, onCompanyFilter}) =>
  <div className="LogoList">
    {Object.keys(LOGO_FILES).sort().map(company_name =>
      <img src={LOGO_FILES[company_name]} key={company_name} alt={company_name} data-company_name={company_name}
           onMouseEnter={e => onCompanyFilter(company_name, false)} onMouseLeave={e => onCompanyFilter(null, false)}
           onClick={e => onCompanyFilter(company_name, true)}
           className={filterCompany === company_name ? 'active' : ''}/>)}
  </div>;

class App extends Component {
  downloadedFeeds = {};
  state = {
    errors: [],
    filterByCompany: null,
    filterSticky: false,
    posts: [],
    scale: 'Large'
  };

  componentDidMount() {
    this.onRefreshClicked();
    this.timerID = setInterval(() => this.onRefreshClicked(), 3600 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  onRefreshClicked() {
    FEEDS.forEach(spec => FeedParser.loadAndParse(spec.url, (err, feed) => {
      if (err) {
        console.error("Error while fetching " + spec.name + ", on: " + spec.url);
        console.log(err);
        // TODO: add capture of errors
        return;
      }
      // add the original spec to the new feed
      feed.spec = spec;
      // update the static global contents for this feed
      this.downloadedFeeds[spec.id] = feed;
      // point every post to the containing feed, and to our internal feed DB entry
      feed.posts.forEach(post => post['feed'] = feed);
      // regen the posts list
      this.updateFeedPosts();
    }));
  }

  updateFeedPosts() {
    // re-make the full posts list
    let posts = [];
    Object.keys(this.downloadedFeeds).map(feedId => this.downloadedFeeds[feedId]).forEach(feed => {
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
        <Header scale={this.state.scale} onRefreshClick={this.onRefreshClicked.bind(this)}
                onScaleChange={this.onScaleChange.bind(this)}/>
        <div className='container App-Body'>
          <LogoList filterCompany={this.state.filterByCompany} onCompanyFilter={this.onCompanyFilter.bind(this)}/>
          <FeedPosts posts={this.state.posts} filterByCompany={this.state.filterByCompany}/>
        </div>
      </div>
    );
  }
}

export default App;
