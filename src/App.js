// @flow
import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import idx from 'idx';

import HtmlContent from './HtmlContent';
import PaginationOverlay from './PaginationOverlay';
import Photo from './Photo';
import Text from './Text';
import Video from './Video';

type State = {|
  active: number,
  autoplayTimer: ?number,
  blogIdentifier: string,
  initialOffset: number,
  isGetNewPostsPending: boolean,
  posts: Object[],
|};

// This is the tumblr image API limit.
const PAGE_SIZE = 20;
// Timeout before moving to next image.
const AUTOPLAY_INTERVAL = 3000;

const getPosts = (blogIdentifier: string, offset?: number = 0) => {
  return fetch(
    `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?api_key=${process
      .env.REACT_APP_API_KEY || ''}&limit=${PAGE_SIZE}&offset=${offset}`,
  )
    .then(res => res.json())
    .then(json => json.response.posts || []);
};

const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach(imageUrl => {
    const img = new Image();
    img.src = imageUrl;
  });
};

const UI_FONT = `
  -apple-system, BlinkMacSystemFont,
  "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
  "Fira Sans", "Droid Sans", "Helvetica Neue",
  sans-serif
`;

const Root = styled.div`
  align-items: center;
  background: rgb(48, 48, 48);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Body = styled.div`
  box-sizing: border-box;
  display: grid;
  flex-grow: 1;
  grid-template-columns: 100%;
  grid-gap: 20px;
  padding: 20px;
  position: relative;
`;

const Button = styled.button`
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  max-width: 1200px;
`;

const Counter = styled.div`
  bottom: 0;
  color: LightGray;
  font-family: ${UI_FONT};
  padding: 5px 10px;
  position: fixed;
  right: 0;
`;

const Header = styled.div`
  display: flex;
  padding: 20px;
`;

const Input = styled.input`
  border: 1px solid LightGray;
  border-radius: 2px;
  box-sizing: border-box;
  display: block;
  font-family: ${UI_FONT};
  flex-grow: ${props => (props.primary ? '2' : '1')};
  flex-basis: 0;
  line-height: 1.375;
  min-width: 0;
  padding: 5px;
  transition: 150;
  width: 100%;

  &:focus {
    border-color: CornflowerBlue;
    outline: none;
  }
`;

const Spacer = styled.div`
  width: 20px;
`;

class App extends Component<{||}, State> {
  next: () => void;
  previous: () => void;
  toggleAutoplay: () => void;

  constructor(props: {||}) {
    super(props);

    this.state = {
      active: 0,
      autoplayTimer: undefined,
      blogIdentifier: '',
      initialOffset: 0,
      isGetNewPostsPending: false,
      posts: [],
    };

    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.toggleAutoplay = this.toggleAutoplay.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onDocumentKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onDocumentKeyDown);
  }

  onDocumentKeyDown = (event: KeyboardEvent) => {
    const { active, isGetNewPostsPending, posts } = this.state;

    // Bail if this event was triggered in an input.
    if (event.target instanceof HTMLInputElement) return;

    switch (event.key) {
      case 'ArrowRight':
        this.next();
        break;
      case 'ArrowLeft':
        this.previous();
        break;
      case ' ':
        event.preventDefault();
        this.toggleAutoplay();
        break;
      default:
        console.log(event.key);
      // do nothing
    }
  };

  onInputEnter = (event: KeyboardEvent) => {
    const { isGetNewPostsPending } = this.state;
    if (event.key === 'Enter' && !isGetNewPostsPending) {
      this.setState(
        state => ({ ...state, active: 0, posts: [] }),
        () => {
          this.getNewPosts();
        },
      );
    }
  };

  getNewPosts = () => {
    const { blogIdentifier, initialOffset, posts } = this.state;
    const offset = initialOffset + posts.length;

    this.setState(state => ({ ...state, isGetNewPostsPending: true }));

    getPosts(blogIdentifier, offset).then(posts => {
      const supportedPosts = posts.filter(
        ({ type }) => type === 'photo' || type === 'text' || type === 'video',
      );

      const imageUrls = posts
        .filter(({ type }) => type === 'photo')
        .map(post => idx(post, _ => _.photos[0].alt_sizes[0].url) || '');

      preloadImages(imageUrls);

      this.setState(state => ({
        ...state,
        isGetNewPostsPending: false,
        posts: [...state.posts, ...supportedPosts],
      }));
    });
  };

  /**
   * Advance to the next post.
   */
  next() {
    const { active, isGetNewPostsPending, posts } = this.state;
    // If we're near the end of the list of posts that we already have, fetch more.
    if (active + 5 >= posts.length && !isGetNewPostsPending)
      this.getNewPosts();
    this.setState(state => ({ ...state, active: state.active + 1 }));
  }

  previous() {
    this.setState(state => ({
      ...state,
      active: Math.max(state.active - 1, 0),
    }));
  }

  toggleAutoplay() {
    if (this.state.autoplayTimer == null) {
      const autoplayTimer = window.setInterval(() => {
        this.next();
      }, AUTOPLAY_INTERVAL);
      this.setState(state => ({ ...state, autoplayTimer }));
    } else {
      window.clearInterval(this.state.autoplayTimer);
      this.setState(state => ({ ...state, autoplayTimer: undefined }));
    }
  }

  render() {
    const { active, autoplayTimer, blogIdentifier, initialOffset, posts } = this.state;

    const activePost = idx(posts, _ => _[active]);
    const activePostType = idx(activePost, _ => _.type);
    const activePhotoUrls = (idx(activePost, _ => _.photos) || []).map(photo => photo.alt_sizes[0].url);
    const activeTextBody = idx(activePost, _ => _.body)
    const activeVideoPlayerCount = idx(activePost, _ => _.player.length) || 0;
    const activeVideoEmbedCode =
      idx(activePost, _ => _.player[activeVideoPlayerCount - 1].embed_code) ||
      '';

    return (
      <Root>
        <Container>
          <Header>
            <Input
              onChange={event => {
                const blogIdentifier = event.target.value;
                this.setState(state => ({ ...state, blogIdentifier }));
              }}
              onKeyPress={this.onInputEnter}
              placeholder="Blog Identifier"
              primary
              value={blogIdentifier}
            />
            <Spacer />
            <Input
              onChange={event => {
                let initialOffset = parseInt(event.target.value, 10);
                if (Number.isNaN(initialOffset)) initialOffset = 0;
                this.setState(state => ({ ...state, initialOffset }));
              }}
              onKeyPress={this.onInputEnter}
              placeholder="Starting Post"
              title="Starting Post"
              type="number"
              value={initialOffset}
            />
            <Spacer />
            <Button onClick={this.toggleAutoplay}>{autoplayTimer == null ? 'Play' : 'Pause'}</Button>
          </Header>
          <Body>
            {activePostType === 'photo' && (
              <Fragment>
                {activePhotoUrls.map(photoUrl => (
                  <Photo key={photoUrl} src={photoUrl} />
                ))}
                <HtmlContent html={idx(activePost, _ => _.caption) || ''} />
              </Fragment>
            )}
            {activePostType === 'text' && (
              <Text body={activeTextBody} />
            )}
            {activePostType === 'video' && (
              <Video embedCode={activeVideoEmbedCode} />
            )}
            <PaginationOverlay next={this.next} previous={this.previous} />
          </Body>
        </Container>
        <Counter>{initialOffset + active}</Counter>
      </Root>
    );
  }
}

export default App;
