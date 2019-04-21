import React from 'react';
import styled from 'styled-components';

type Props = {
  embedCode?: string;
};

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

const Video = ({ embedCode = '' }: Props) => (
  <Root
    dangerouslySetInnerHTML={{
      __html: embedCode.replace('<video', '<video controls loop autoplay'),
    }}
  />
);

export default Video;
