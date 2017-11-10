// @flow
import React from 'react';
import styled from 'styled-components';

type Props = {
  embedCode: string | void,
};

const Root = styled.div`
  display: flex;
  justify-content: center;
  max-width: 1200px;
  width: 100%;
`;

const Video = ({ embedCode = '' }: Props) => (
  <Root
    dangerouslySetInnerHTML={{
      __html: embedCode.replace('<video', '<video controls loop'),
    }}
  />
);

export default Video;
