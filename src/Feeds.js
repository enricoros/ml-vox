const LOGO_FILES = {
  'Qualcomm': 'logo-qualcomm.png',
  // 'Qualcomm Ventures': 'logo-qualcomm-ventures.png',
  'Amazon': 'logo-amazon.png',
  'Apple': 'logo-apple.png',
  'Google': 'logo-google.png',
  'Google DeepMind': 'logo-google-deepmind.png',
  'Intel': 'logo-intel-nervana.png',
  'Microsoft': 'logo-microsoft.png',
  'Facebook': 'logo-facebook.png',
  'NVIDIA': 'logo-nvidia.png',
  'CEVA': 'logo-ceva.png',
  'OpenAI': 'logo-openai.png',
  'Two Minute Papers': 'logo-misc-two-minute-papers.png',
  'Otoro Blog': 'logo-misc-otoro.png',
};

const FEEDS = [
  // {
  //   id: 'q1',
  //   company: 'Qualcomm',
  //   name: 'Qualcomm Developer Network Blogs',
  //   url: 'https://developer.qualcomm.com/rssfeed',
  //   home: 'https://developer.qualcomm.com/blogs'
  // },
  // {
  //   id: 'q2',
  //   company: 'Qualcomm Ventures',
  //   name: 'Qualcomm Ventures',
  //   url: 'https://medium.com/feed/qualcomm-ventures',
  //   home: 'https://medium.com/qualcomm-ventures'
  // },
  {
    id: 'q3',
    company: 'Qualcomm',
    name: 'Qualcomm Life',
    url: 'http://www.qualcommlife.com/blog/feed/rss/our-blog?format=feed',
    home: 'http://www.qualcommlife.com/blog'
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
    url: 'https://aws.amazon.com/blogs/ai/feed/',
    home: 'https://aws.amazon.com/blogs/ai/'
  },
  {
    id: 'aa',
    company: 'Apple',
    name: 'Apple Machine Learning Journal',
    url: 'https://machinelearning.apple.com/feed.xml',
    home: 'https://machinelearning.apple.com/'
  },
  {
    id: 'g1',
    company: 'Google',
    comments: 'Brain, NO Magenta, etc.',
    name: 'Google Research Blog',
    // url: 'https://www.blogger.com/feeds/21224994/posts/default',
    url: 'https://www.blogger.com/feeds/21224994/posts/default/-/Machine%20Learning',
    home: 'https://research.googleblog.com/'
  },
  {
    id: 'g2',
    company: 'Google DeepMind',
    name: 'Deep Mind Blog',
    url: 'https://deepmind.com/blog/feed/basic/',
    home: 'https://deepmind.com/blog/'
  },
  {
    id: 'g3',
    company: 'Google',
    name: 'Magenta',
    url: 'https://magenta.tensorflow.org/feed.xml',
    home: 'https://magenta.tensorflow.org/blog/'
  },
  {
    id: 'ii',
    company: 'Intel',
    name: 'Intel Nervana Blog',
    url: 'https://www.intelnervana.com/feed/',
    home: 'https://www.intelnervana.com/blog/'
  },
  {
    id: 'mm',
    company: 'Microsoft',
    name: 'Microsoft Next',
    url: 'https://blogs.microsoft.com/ai/feed/',
    home: 'https://blogs.microsoft.com/next/'
  },
  {
    id: 'ff',
    company: 'Facebook',
    name: 'Caffe2 Blog',
    url: 'https://caffe2.ai/feed.xml',
    home: 'https://caffe2.ai/blog/'
  },
  {
    id: 'nn',
    company: 'NVIDIA',
    name: 'NVIDIA Deep Learning',
    url: 'https://blogs.nvidia.com/blog/category/deep-learning/feed/',
    home: 'https://blogs.nvidia.com/blog/category/deep-learning/'
  },
  {
    id: 'cc',
    company: 'CEVA',
    name: 'CEVA Experts Blog',
    url: 'http://www.ceva-dsp.com/ourblog/feed/',
    home: 'http://www.ceva-dsp.com/ourblog/'
  },
  {
    id: 'oa',
    company: 'OpenAI',
    name: 'OpenAI Blog',
    url: 'https://blog.openai.com/rss/',
    home: 'https://blog.openai.com/'
  },

  {
    id: 'tmp',
    company: 'Two Minute Papers',
    name: 'Two Minute Papers',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg',
    home: 'https://www.youtube.com/channel/UCbfYPyITQ-7l4upoX8nvctg',
    title_prefix: '(learn something)'
  },
  {
    id: 'oto',
    company: 'Otoro',
    name: 'Otoro Blog',
    url: 'http://blog.otoro.net/feed.xml',
    home: 'http://blog.otoro.net/',
    title_prefix: '(ml+design)'
  }
];

// const LINKS = [
//   'https://www.eff.org/ai/metrics', 'http://aiweekly.co/
// ];

export {FEEDS, LOGO_FILES};
