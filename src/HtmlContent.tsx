import React from 'react';
import styled from 'styled-components';

type Props = {
  html: string;
};

const Root = styled.div`
  color: white;
  a {
    color: #ddd;

    &:visited {
      color: #aaa;
    }
  }

  figure {
    margin: 1em 0;
    position: relative;

    &::after {
      bottom: 0;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.9);
      content: '';
      display: block;
      left: 0;
      pointer-events: none;
      position: absolute;
      right: 0;
      top: 0;
    }
  }

  img {
    display: block;
    width: 100%;
  }

  video {
    display: block;
    width: 100%;
  }
`;

const HtmlContent = ({ html }: Props) => (
  <Root
    dangerouslySetInnerHTML={{
      __html: html.replace('<video', '<video controls loop autoplay'),
    }}
  />
);

export default HtmlContent;
