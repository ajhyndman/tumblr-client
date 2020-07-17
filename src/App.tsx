import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import HtmlContent from './HtmlContent';
import PaginationOverlay from './PaginationOverlay';
import Photo from './Photo';
import Text from './Text';
import Video from './Video';
import { fetchSigned } from './util/fetchSigned';

type Photo = {
  alt_sizes: { url: string }[];
};

type Player = {
  embed_code: string;
};

type Post = {
  id_string: string;
  reblog_key: string;
  type: string;
  liked: boolean;
  body?: string;
  caption?: string;
  photos?: Photo[];
  player?: Player[];
};

type State = {
  active: number;
  autoplayTimer: number | undefined;
  blogIdentifier: string;
  initialOffset: number;
  isGetNewPostsPending: boolean;
  posts: Post[];
};

type RequestData = {
  url: string;
  method: string;
  data?: { [key: string]: any };
};

// This is the tumblr image API limit.
const PAGE_SIZE = 20;
// Timeout before moving to next image.
const AUTOPLAY_INTERVAL = 3000;

const getPosts = (
  blogIdentifier: string,
  offset: number = 0,
): Promise<Post[]> => {
  return fetchSigned(
    `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?api_key=${process
      .env.REACT_APP_API_KEY || ''}&limit=${PAGE_SIZE}&offset=${offset}`,
  )
    .then(res => res.json())
    .then(json => json.response.posts || []);
};

const likePost = (postId: string, reblogKey: string) => {
  const params = {
    id: postId,
    reblog_key: reblogKey,
  };

  return fetchSigned('https://api.tumblr.com/v2/user/like', {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf8',
    },
    body: JSON.stringify(params),
  });
};

const unlikePost = (postId: string, reblogKey: string) => {
  const params = {
    id: postId,
    reblog_key: reblogKey,
  };

  return fetchSigned('https://api.tumblr.com/v2/user/unlike', {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf8',
    },
    body: JSON.stringify(params),
  });
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
  font-size: 1.25rem;
  border: none;
  border-radius: 2px;
  box-shadow: none;
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
  border: none;
  border-radius: 2px;
  box-sizing: border-box;
  display: block;
  font-family: ${UI_FONT};
  flex-grow: 1;
  flex-basis: 0;
  font-size: 1.25rem;
  line-height: 1.375;
  min-width: 0;
  padding: 5px 10px;
  transition: 150;
  width: 100%;

  &.primary {
    flex-grow: 2;
  }

  &:focus {
    border-color: CornflowerBlue;
    outline: none;
  }
`;

const Spacer = styled.div`
  width: 20px;
`;

const App = () => {
  const [state, setState] = useState<State>({
    active: 0,
    autoplayTimer: undefined,
    blogIdentifier: '',
    initialOffset: 0,
    isGetNewPostsPending: false,
    posts: [],
  });

  const getNewPosts = useCallback((state: State) => {
    const { blogIdentifier, initialOffset, posts } = state;
    const offset = initialOffset + posts.length;

    setState(state => ({ ...state, isGetNewPostsPending: true }));

    getPosts(blogIdentifier, offset).then(posts => {
      const supportedPosts = posts.filter(
        ({ type }) => type === 'photo' || type === 'text' || type === 'video',
      );

      const imageUrls = posts
        .filter(({ type }) => type === 'photo')
        .map(
          post =>
            (((((post || {}).photos || [])[0] || {}).alt_sizes || [])[0] || {})
              .url || '',
        );

      preloadImages(imageUrls);

      setState(state => ({
        ...state,
        isGetNewPostsPending: false,
        posts: [...state.posts, ...supportedPosts],
      }));
    });
  }, []);

  const updatePost = useCallback(
    (index: number, partialPost: Partial<Post>) => {
      setState(state => {
        const nextPosts = state.posts.slice();
        const prevPost = nextPosts[index];
        nextPosts[index] = { ...prevPost, ...partialPost };
        return { ...state, posts: nextPosts };
      });
    },
    [],
  );

  const onInputEnter = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const { isGetNewPostsPending } = state;
      if (event.key === 'Enter' && !isGetNewPostsPending) {
        setState(state => ({ ...state, active: 0, posts: [] }));
        // trigger fetch _after_ state has updated.
        setTimeout(() => getNewPosts({ ...state, active: 0, posts: [] }));
      }
    },
    [state, getNewPosts],
  );

  const clearAutoplay = useCallback(() => {
    if (state.autoplayTimer != null) {
      window.clearInterval(state.autoplayTimer);
      setState(state => ({ ...state, autoplayTimer: undefined }));
    }
  }, [state]);

  /**
   * Advance to the next post.
   */
  const next = useCallback(() => {
    clearAutoplay();

    const { active, isGetNewPostsPending, posts } = state;
    // If we're near the end of the list of posts that we already have, fetch more.
    if (active + 5 >= posts.length && !isGetNewPostsPending) getNewPosts(state);
    setState(state => ({ ...state, active: state.active + 1 }));
  }, [getNewPosts, state, clearAutoplay]);

  /**
   * Retreat to the previous post.
   */
  const previous = useCallback(() => {
    clearAutoplay();

    setState(state => ({
      ...state,
      active: Math.max(state.active - 1, 0),
    }));
  }, [clearAutoplay]);

  const toggleAutoplay = useCallback(() => {
    if (state.autoplayTimer == null) {
      const autoplayTimer = window.setInterval(() => {
        next();
      }, AUTOPLAY_INTERVAL);
      setState(state => ({ ...state, autoplayTimer }));
    } else {
      clearAutoplay();
    }
  }, [next, state, clearAutoplay]);

  const onDocumentKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Bail if this event was triggered in an input.
      if (event.target instanceof HTMLInputElement) return;

      switch (event.key) {
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          previous();
          break;
        case ' ':
          event.preventDefault();
          toggleAutoplay();
          break;
        default:
          console.log(event.key);
        // do nothing
      }
    },
    [next, previous, toggleAutoplay],
  );

  useEffect(() => {
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [onDocumentKeyDown]);

  const { active, autoplayTimer, blogIdentifier, initialOffset, posts } = state;

  const activePost = posts[active] || {};
  const activePostType = activePost.type;
  const activePhotoUrls = (activePost.photos || []).map(
    photo => photo.alt_sizes[0].url,
  );
  const activeTextBody = activePost.body;
  const activeVideoPlayerCount = (activePost.player || []).length || 0;
  const activeVideoEmbedCode = (
    (activePost.player || [])[activeVideoPlayerCount - 1] || {
      embed_code: '',
    }
  ).embed_code;

  const toggleLiked = useCallback(async () => {
    if (activePost.liked) {
      await unlikePost(activePost.id_string, activePost.reblog_key);
      updatePost(active, { liked: false });
    } else {
      await likePost(activePost.id_string, activePost.reblog_key);
      updatePost(active, { liked: true });
    }
  }, [activePost]);

  return (
    <Root>
      <Container>
        <Header>
          <Input
            autoCapitalize="off"
            className="primary"
            onChange={event => {
              const blogIdentifier = event.target.value;
              setState(state => ({ ...state, blogIdentifier }));
            }}
            onKeyPress={onInputEnter}
            placeholder="Blog Identifier"
            value={blogIdentifier}
          />
          <Spacer />
          <Input
            onChange={event => {
              let initialOffset = parseInt(event.target.value, 10);
              if (Number.isNaN(initialOffset)) initialOffset = 0;
              setState(state => ({ ...state, initialOffset }));
            }}
            onKeyPress={onInputEnter}
            placeholder="Starting Post"
            title="Starting Post"
            type="number"
            value={initialOffset}
          />
          <Spacer />
          <Button onClick={toggleAutoplay}>
            {autoplayTimer == null ? 'Play' : 'Pause'}
          </Button>
          <Button onClick={toggleLiked}>
            {activePost.liked ? 'Unlike' : 'Like'}
          </Button>
        </Header>
        <Body>
          {activePostType === 'photo' && (
            <Fragment>
              {activePhotoUrls.map(photoUrl => (
                <Photo key={photoUrl} src={photoUrl} />
              ))}
              <HtmlContent html={activePost.caption || ''} />
            </Fragment>
          )}
          {activePostType === 'text' && <Text body={activeTextBody} />}
          {activePostType === 'video' && (
            <Video embedCode={activeVideoEmbedCode} />
          )}
          <PaginationOverlay next={next} previous={previous} />
        </Body>
      </Container>
      <Counter>{initialOffset + active}</Counter>
    </Root>
  );
};

export default App;
