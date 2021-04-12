# setup

this page contains info to help you get diagnose issues w/ deployments to the www.

## table of contents

- [hosting](#hosting)
- [debugging](#debugging)

## hosting [↑](#table-of-contents)

our sites are hosted by [netlify.com](https://www.netlify.com/). you can find the sites at:

| channel | url |
| ------- | --- |
| dev     | https://hungry-englebart.netlify.app |
| live    | https://nostalgic-englebart.netlify.app |

## debugging [↑](#table-of-contents)

you can sign into the [netlify](https://www.netlify.com/) using the frog's secret credentials; they should be in the doc. one signed-in, you should see both the hungry and nostalgic engelbarts listed, and you can click one of them to inspect that site.

the first step is probably to check the `deploys` tab to see the logs for the most recent build. you an find that on this page, https://app.netlify.com/sites/hungry-engelbart/deploys, where `hungry-englebart` with the site of your choosing. clicking on a deploy in the list will bring up its log.

the `site settings` tab also has a lot of useful configuration options. that is the next place to look if you need to reconfigure the deployment in any way.
