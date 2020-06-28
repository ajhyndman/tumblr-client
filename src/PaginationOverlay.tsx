import React from 'react';
import styled from 'styled-components';

type Props = {
  next: () => void;
  previous: () => void;
};

const Overlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
`;

const NavigationButton = styled.div`
  border: none;
  cursor: pointer;
  display: block;
  outline: none;
  padding: 0;
  pointer-events: all;
  position: absolute;
  top: 0;
  bottom: 0;
`;

const NavigationButtonLeft = styled(NavigationButton)`
  left: calc(-50vw + 50%);
  right: 93%;
`;

const NavigationButtonRight = styled(NavigationButton)`
  right: calc(-50vw + 50%);
  left: 93%;
`;

const PaginationOverlay = ({ next, previous }: Props) => (
  <Overlay>
    <NavigationButtonLeft
      tabIndex={0}
      role="button"
      onClick={previous}
      title="previous"
    />
    <NavigationButtonRight
      tabIndex={0}
      role="button"
      onClick={next}
      title="next"
    />
  </Overlay>
);

export default PaginationOverlay;
