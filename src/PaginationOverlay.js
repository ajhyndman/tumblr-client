// @flow
import React from 'react';
import styled from 'styled-components';

type Props = {|
  next: () => void,
  previous: () => void,
|};

const Overlay = styled.div`
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const NavigationButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  flex-basis: 40%;
  outline: none;
  padding: 0;
`;

const PaginationOverlay = ({ next, previous }: Props) => (
  <Overlay>
    <NavigationButton onClick={previous} title="previous" />
    <NavigationButton onClick={next} title="next" />
  </Overlay>
);

export default PaginationOverlay;
