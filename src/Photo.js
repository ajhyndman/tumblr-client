// @flow
import React from 'react';
import styled from 'styled-components';

const Image = styled.img`
  display: block;
  width: 100%;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Root = styled.div``;

const Frame = styled.div`
  bottom: 0;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.9);
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
`;

const Photo = (props: Object) => (
  <Root>
    <ImageContainer>
    <Image {...props} />
    <Frame />
    </ImageContainer>
  </Root>
);

export default Photo;
