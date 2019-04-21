import React from 'react';
import styled from 'styled-components';

import HtmlContent from './HtmlContent';

type Props = {
  body: string | void;
};

const Root = styled.div`
  max-width: 1200px;
`;

const Text = ({ body = '' }: Props) => (
  <Root>
    <HtmlContent html={body} />
  </Root>
);

export default Text;
