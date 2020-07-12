import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';

type Props = {
  embedCode?: string;
};

// Insttagram global injected by script below.
declare global {
  var instgrm: any;
}

const Root = styled.div`
  display: flex;
  justify-content: center;
  max-width: 1200px;
  width: 100%;

  video {
    display: block;
    /* 'height: 100%" effectively unsets any existing height value */
    height: 100%;
    width: 100%;
  }
`;

const Video = ({ embedCode = '' }: Props) => {
  useEffect(() => {
    if (window.instgrm != null) {
      window.instgrm.Embeds.process();
    }
  }, []);

  return (
    <>
      <Helmet>
        <script defer async src="//www.instagram.com/embed.js" />
      </Helmet>
      <Root
        dangerouslySetInnerHTML={{
          __html: embedCode.replace('<video', '<video controls loop autoplay'),
        }}
      />
    </>
  );
};

export default Video;
