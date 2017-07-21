import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";
import "./App.css";

import React, {Component} from "react";
import {Button, Clearfix, Col, Row} from "react-bootstrap";

import {LOGO_FILES, QFEEDS} from "./FeedDB";
import FeedFetcher from "./FeedFetcher";

const colorize = (snippet, color) => <span style={{color: color}}>{snippet}</span>;

const humanDate = (dateTS) => {
  const date = new Date(dateTS);
  const elapsed = Date.now() - dateTS;
  if (elapsed < 10 * 60 * 1000)
    return colorize('just now.', 'darkgreen');
  if (elapsed < 90 * 60 * 1000)
    return colorize('one hour ago.', 'darkgreen');
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

const Post = ({post}) =>
  <div className="Post">
    <h2><a href={post.url}>{post.title}</a></h2>
    <div className="Content">
      <p>
        <span className='Company'>
          {/*post.qf.company*/}
          <img src={LOGO_FILES[post.qf.company]} onClick={() => console.log(post)} alt={post.qf.company + ' logo'}/>
        </span>
        {post._thumbUrl && <span className="Thumbnail">
          <img src={post._thumbUrl} alt="Post thumbnail"/>
        </span>}
        <span>{(post.description || post.title).substring(0, 1000)}</span>
      </p>
      <Clearfix/>
      <div className="Footer">
        <Row>
          <Col md={8} style={{textAlign: 'left'}}>- {post._author || post.feed.title}, {humanDate(post.date)}</Col>
          <Col md={4} style={{textAlign: 'right'}}><a href={post.feed.url}>- {post.qf.name}</a></Col>
        </Row>
      </div>
    </div>
  </div>;

const Separator = ({title}) => <div className="Separator">{title && <span>{title}</span>}</div>;

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

const hashForPost = (p) => stringHash(p.qf.id + p.date);

class FeedList extends Component {
  render() {
    const today = Date.now() - 1.2 * 24 * 3600 * 1000;
    let filteredPosts = this.props.posts.filter(p => this.props.filterByCompany ? p.qf.company === this.props.filterByCompany : true);
    const todayPosts = filteredPosts.filter(p => p.date >= today);
    const afterPosts = filteredPosts.filter(p => p.date < today);
    return <div>
      {todayPosts.length > 0 && <div>{todayPosts.map(p => <Post post={p} key={hashForPost(p)}/>)}</div>}
      {todayPosts.length > 0 && <Separator title="Yesterday and before"/>}
      {afterPosts.length > 0 && <div>{afterPosts.map(p => <Post post={p} key={hashForPost(p)}/>)}</div>}
      <hr/>
      <div className="Post TheEnd">
        <h3>&nbsp;</h3>
        <h3>Only showing up to 4 weeks. Everything else is old.</h3>
        <h3>Enjoy</h3>
        <h3>&nbsp;</h3>
      </div>
    </div>
  }
}

const Header = ({onRefreshClick, scale, onScaleChange}) =>
  <div className="App-header">
    <div className="container">
      <h2>
        <Row>
          <Col md={8}>
            AI/ML Leaders Voice
          </Col>
          <Col md={4} className="App-header-right">
            <Button onClick={onScaleChange} className="btn-transparent">{scale}</Button>
            <Button onClick={onRefreshClick} bsStyle="primary">Refresh</Button>
          </Col>
        </Row>
      </h2>
    </div>
  </div>;

const LogoList = ({onCompanyFilter}) =>
  <div className="LogoList">
    {Object.keys(LOGO_FILES).sort().map(company_name =>
      <img src={LOGO_FILES[company_name]} key={company_name} alt="" data-company_name={company_name}
           onMouseEnter={e => onCompanyFilter(company_name, false)} onMouseLeave={e => onCompanyFilter(null, false)}
           onClick={e => onCompanyFilter(company_name, true)} style={{cursor: 'pointer'}}/>)}
  </div>;

class App extends Component {
  aggregatedFeeds = {};
  state = {
    filterByCompany: null,
    filterSticky: false,
    posts: [],
    scale: 'Large'
  };

  componentDidMount() {
    this.onRefreshClicked();
  }

  onRefreshClicked() {
    QFEEDS.forEach(qf => FeedFetcher.loadAndParse(qf.url, (err, feed) => {
      if (err) {
        console.error("Error while fetching " + qf.name + ", on: " + qf.url);
        console.log(err);
        return
      }
      // update the static global contents for this feed
      this.aggregatedFeeds[qf.id] = feed;
      // point every post to the containing feed, and to our internal feed DB entry
      feed.posts.forEach(i => {
        i['feed'] = feed;
        i['qf'] = qf;
      });
      // re-make the full posts list
      let posts = [];
      Object.keys(this.aggregatedFeeds).map(qfid => this.aggregatedFeeds[qfid]).forEach(feed => {
        posts = posts.concat(feed.posts);
      });
      // update the UI with sorted posts by time, newest on top, without posts older than 2 months
      const recentEnough = Date.now() - 4 * 7 * 24 * 3600 * 1000;
      const sortedPosts = posts.filter(p => p.date > recentEnough).sort((a, b) => b.date - a.date);
      this.setState({posts: sortedPosts});
    }));
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
        <Header onRefreshClick={this.onRefreshClicked.bind(this)} scale={this.state.scale}
                onScaleChange={this.onScaleChange.bind(this)}/>
        <div className='container App-Body'>
          <LogoList onCompanyFilter={this.onCompanyFilter.bind(this)}/>
          <FeedList posts={this.state.posts} filterByCompany={this.state.filterByCompany}/>
        </div>
      </div>
    );
  }
}

export default App;
