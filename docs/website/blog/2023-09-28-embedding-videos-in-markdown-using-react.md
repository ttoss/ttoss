---
title: 'Embedding Videos in Markdown using React'
description: The provided structure allows for the creation of a user interface that can effectively render Markdown content with embedded videos, offering a rich content experience for the end-users.
authors:
  - rayza
tags:
  - markdown
  - content
  - youtube
---

In modern web development, rendering rich content like videos within markdown files is a common requirement. This post demonstrates how to work with videos inside markdowns using React, utilizing a custom React component.

## Setup

Firstly, ensure you have a React project set up. In this demonstration, we're using a custom Markdown component from the `@ttoss/component` package, which is based on `react-markdown`.

```javascript
import { Markdown } from '@ttoss/component'; // based on react-markdown
```

## Creating a Markdown Content Component

Let's create a `MarkdownContent` component to render the content. This component accepts a `content` prop which is the markdown content as a string.

```javascript
type MarkdownContentProps = {
  content: string;
};

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
  // component body
};
```

## Customizing the Markdown Component

The `Markdown` component from `@ttoss/component` allows us to customize the rendering of HTML elements. In this case, we're interested in customizing the rendering of anchor (`<a>`) elements to embed YouTube videos.

```javascript
<Markdown
  components={{
    a: (props: any) => {
      // custom rendering
    },
  }}
>
  {content}
</Markdown>
```

## Obtaining the Embed Link from YouTube

To embed a YouTube video, you need to obtain the embed link for the video. Follow these steps:

1. Go to the video on YouTube.
2. Click on "SHARE" below the video.
3. Click on "Embed".
4. Copy the URL from the provided code. The URL will be in the format: `https://www.youtube.com/embed/VIDEO_ID`

## Handling Video Links

We need to identify links that are meant to embed videos. In this example, we check if the `href` attribute of the anchor element contains the strings 'youtube' or 'embed'.

```javascript
if (['youtube', 'embed'].every((item) => props.href.includes(item))) {
  // custom rendering for video links
}
```

## Embedding the Video

For links identified as video links, we return a custom component structure to embed the video within an iframe.

```javascript
return (
  <Box
    sx={{
      position: 'relative',
      paddingBottom: ['56.25%', 'calc(56.25% * 0.75)'],
      width: ['unset', '75%'],
      height: 0,
      margin: '0 auto',
    }}
  >
    <Box
      as="iframe"
      sx={{
        border: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
      // @ts-ignore
      src={props.href}
      allowfullscreen="allowfullscreen"
    />
  </Box>
);
```

## Usage Example

Here is an example of how you can use the `MarkdownContent` component with a YouTube video:

```javascript
const videoMarkdownContent = `
# My Favorite Video
Here is my favorite YouTube video:
[a video](https://www.youtube.com/embed/VIDEO_ID)
`;

function MyApp() {
  return <MarkdownContent content={videoMarkdownContent} />;
}

export default MyApp;
```

In this example, replace `VIDEO_ID` with the YouTube video ID you want to embed.

## Conclusion

This setup allows you to render markdown content with embedded videos in a React application, providing a rich content experience. By customizing the rendering of markdown elements, you can handle various content types and create a tailored viewing experience for your users.
