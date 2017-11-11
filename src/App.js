// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import idx from 'idx';

import Photo from './Photo';
import Video from './Video';

type State = {|
  active: number,
  blogIdentifier: string,
  isGetNewPostsPending: boolean,
  posts: Object[],
|};

// This is the tumblr image API limit.
const PAGE_SIZE = 20;
// Change this if you want to start paginating from a deep offset.
const INITIAL_OFFSET = 0;

const getPosts = (blogIdentifier: string, offset?: number = 0) => {
  return fetch(
    `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?api_key=${process
      .env.REACT_APP_API_KEY || ''}&limit=${PAGE_SIZE}&offset=${offset}`,
  )
    .then(res => res.json())
    .then(json => json.response.posts);
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
  background: rgb(48, 48, 48);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Body = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-grow: 1;
  justify-content: center;
  padding: 20px;
`;

const Counter = styled.div`
  bottom: 0;
  color: LightGray;
  font-family: ${UI_FONT};
  padding: 5px 10px;
  position: fixed;
  right: 0;
`;

const Input = styled.input`
  border: 1px solid LightGray;
  border-radius: 2px;
  box-sizing: border-box;
  display: block;
  font-family: ${UI_FONT};
  line-height: 1.375;
  padding: 5px;
  transition: 150;
  width: 100%;

  &:focus {
    border-color: CornflowerBlue;
    outline: none;
  }
`;

class App extends Component<{||}, State> {
  constructor(props: {||}) {
    super(props);

    this.state = {
      active: 0,
      blogIdentifier: '',
      isGetNewPostsPending: false,
      posts: [],
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onDocumentKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onDocumentKeyDown);
  }

  onDocumentKeyDown = (event: KeyboardEvent) => {
    const { active, isGetNewPostsPending, posts } = this.state;

    switch (event.key) {
      case 'ArrowRight':
        // If we're near the end of the list of posts that we already have, fetch more.
        if (active + 5 >= posts.length && !isGetNewPostsPending)
          this.getNewPosts();
        this.setState(state => ({ ...state, active: state.active + 1 }));
        break;
      case 'ArrowLeft':
        this.setState(state => ({
          ...state,
          active: Math.max(state.active - 1, 0),
        }));
        break;
      default:
      // do nothing
    }
  };

  getNewPosts = () => {
    const { blogIdentifier, posts } = this.state;
    const offset = INITIAL_OFFSET + posts.length;

    this.setState(state => ({ ...state, isGetNewPostsPending: true }));
    getPosts(blogIdentifier, offset).then(posts => {
      const supportedPosts = posts.filter(
        ({ type }) => type === 'photo' || type === 'video',
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

  render() {
    const { active, blogIdentifier, isGetNewPostsPending, posts } = this.state;

    const activePost = idx(posts, _ => _[active]);
    const activePostType = idx(activePost, _ => _.type);
    const activePhotoUrl = idx(activePost, _ => _.photos[0].alt_sizes[0].url);
    const activeVideoPlayerCount = idx(activePost, _ => _.player.length) || 0;
    const activeVideoEmbedCode =
      idx(activePost, _ => _.player[activeVideoPlayerCount - 1].embed_code) ||
      '';

    return (
      <Root>
        <Input
          value={blogIdentifier}
          onChange={event => {
            const blogIdentifier = event.target.value;
            this.setState(state => ({ ...state, blogIdentifier }));
          }}
          onKeyPress={event => {
            if (event.key === 'Enter' && !isGetNewPostsPending) {
              this.setState(
                state => ({ ...state, active: 0, posts: [] }),
                () => {
                  this.getNewPosts();
                },
              );
            }
          }}
        />
        <Body>
          {activePostType === 'photo' && <Photo src={activePhotoUrl} />}
          {activePostType === 'video' && (
            <Video embedCode={activeVideoEmbedCode} />
          )}
        </Body>
        <Counter>{INITIAL_OFFSET + active}</Counter>
      </Root>
    );
  }
}

export default App;
