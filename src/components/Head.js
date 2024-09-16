import React from 'react';
import { Helmet } from 'react-helmet'; // you need to install react-helmet to use it
import { StateManager } from '../utilities/stateManager';

const Head = (props) => {
  const {linkImage = "https://cdn.skywayclassics.com/images/e7dfef11-2239-449d-a228-59ab1fdaa47d.jpeg", metaDescription = "A brief description of your website."} = props;
  const [image, setLinkImage] = React.useState(linkImage);
  StateManager.setLinkImage = setLinkImage;
  const [description, setDescription] = React.useState(metaDescription)
  StateManager.setDescription = setDescription;

  return (
    <Helmet>
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {/* <meta property="og:url" content="https://yourwebsite.com/page-url" /> */}
      <link rel="apple-touch-icon" href={image} />
    </Helmet>
  )
};

export default Head;