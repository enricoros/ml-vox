const LOGO_FILES = {
  'Qualcomm': 'logo-qualcomm.png',
  'Qualcomm Ventures': 'logo-qualcomm-ventures.png',
  'Amazon': 'logo-amazon.png',
  'Apple': 'logo-apple.png',
  'Google': 'logo-google.png',
  'Google DeepMind': 'logo-google-deepmind.png',
  'Intel': 'logo-intel-nervana.png',
  'Microsoft': 'logo-microsoft.png',
  'Facebook': 'logo-facebook.png',
  'NVIDIA': 'logo-nvidia.png',
  'CEVA': 'logo-ceva.png'
};

const QFEEDS = [
  // {
  //   id: 'q1',
  //   company: 'Qualcomm',
  //   name: 'Qualcomm Developer Network Blogs',
  //   url: 'https://developer.qualcomm.com/rssfeed'
  // },
  // {
  //   id: 'q2',
  //   company: 'Qualcomm Ventures',
  //   name: 'Qualcomm Ventures',
  //   url: 'https://medium.com/feed/qualcomm-ventures'
  // },
  {
    id: 'q3',
    company: 'Qualcomm',
    name: 'Qualcomm Life',
    url: 'http://www.qualcommlife.com/blog/feed/rss/our-blog?format=feed'
  },
  // {
  //   id: 'q4',
  //   company: 'Qualcomm',
  //   name: 'Qualcomm SEC Filings',
  //   url: 'http://apps.shareholder.com/rss/rss.aspx?channels=682&companyid=QCOM'
  // },
  {
    id: 'am',
    company: 'Amazon',
    name: 'Amazon AI Blog',
    url: 'https://aws.amazon.com/blogs/ai/feed/'
  },
  {
    id: 'aa',
    company: 'Apple',
    name: 'Apple Machine Learning Journal',
    url: 'https://machinelearning.apple.com/feed.xml'
  },
  {
    id: 'g1',
    company: 'Google',
    comments: 'Brain, NO Magenta, etc.',
    name: 'Google Research Blog',
    // url: 'https://www.blogger.com/feeds/21224994/posts/default'
    url: 'https://www.blogger.com/feeds/21224994/posts/default/-/Machine%20Learning'
  },
  {
    id: 'g2',
    company: 'Google DeepMind',
    name: 'Deep Mind Blog',
    url: 'https://deepmind.com/blog/feed/basic/'
  },
  {
    id: 'g3',
    company: 'Google',
    name: 'Magenta',
    url: 'https://magenta.tensorflow.org/feed.xml'
  },
  {
    id: 'ii',
    company: 'Intel',
    name: 'Intel Nervana Blog',
    url: 'https://www.intelnervana.com/feed/'
  },
  {
    id: 'mm',
    company: 'Microsoft',
    name: 'Microsoft Next',
    url: 'https://blogs.microsoft.com/next/feed/'
  },
  {
    id: 'ff',
    company: 'Facebook',
    name: 'Caffe2 Blog',
    url: 'https://caffe2.ai/feed.xml'
  },
  {
    id: 'nn',
    company: 'NVIDIA',
    name: 'NVIDIA Deep Learning',
    url: 'https://blogs.nvidia.com/blog/category/deep-learning/feed/'
  },
  {
    id: 'cc',
    company: 'CEVA',
    name: 'CEVA Experts Blog',
    url: 'http://www.ceva-dsp.com/ourblog/feed/'
  }
];

// const LINKS = [
//   'https://www.eff.org/ai/metrics'
// ];

export {QFEEDS, LOGO_FILES};
