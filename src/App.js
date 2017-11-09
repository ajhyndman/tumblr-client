// @flow
import React, { Component } from 'react';
import styled from 'styled-components';

type State = {|
  blogIdentifier: string,
  offset: number,
  posts: Object[],
|};

const getPosts = (blogIdentifier: string, offset?: number = 0) => {
  return fetch(
    `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?api_key=${process
      .env.REACT_APP_API_KEY || ''}&limit=${PAGE_SIZE}&offset=${offset}`,
  )
    .then(res => res.json())
    .then(json => json.response.posts);
};

const UI_FONT = `
  -apple-system, BlinkMacSystemFont,
  "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
  "Fira Sans", "Droid Sans", "Helvetica Neue",
  sans-serif
`;

// This is the tumblr image API limit.
const PAGE_SIZE = 20;

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

const Photo = styled.img`
  width: 100%;
  display: block;
`;

class App extends Component<{||}, State> {
  constructor(props: {||}) {
    super(props);

    this.state = {
      blogIdentifier: '',
      offset: 0,
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
    if (event.key === 'ArrowRight') {
      this.getNext();
    } else if (event.key === 'ArrowLeft') {
      this.getPrev();
    }
  };

  getNewPosts = () => {
    const { blogIdentifier, offset } = this.state;
    getPosts(blogIdentifier, offset).then(posts => {
      this.setState(state => ({ ...state, posts }));
    });
  };

  getNext = () => {
    this.setState(state => ({ ...state, offset: state.offset + PAGE_SIZE }));
    this.getNewPosts();
  };

  getPrev = () => {
    this.setState(state => ({ ...state, offset: state.offset - PAGE_SIZE }));
    this.getNewPosts();
  };

  render() {
    const { blogIdentifier } = this.state;
    return (
      <div className="App">
        <Input
          value={blogIdentifier}
          onChange={event => {
            const blogIdentifier = event.target.value;
            this.setState(state => ({ ...state, blogIdentifier }));
          }}
          onKeyPress={event => {
            if (event.key === 'Enter') {
              this.getNewPosts();
            }
          }}
        />
        {this.state.posts
          .filter(({ type }) => type === 'photo')
          .map(({ id, photos }) => {
            return photos.map(({ alt_sizes }, i) => {
              return <Photo key={`${id}-${i}`} src={alt_sizes[0].url} />;
            });
          })}
      </div>
    );
  }
}

export default App;
