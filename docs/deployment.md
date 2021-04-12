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

you can sign into the [netlify](https://www.netlify.com/) using the frog's secret credentials; they should be in the doc. one signed-in, you should see both the hungry and nostalgic engelbarts listed w/ a little preview of the homepage. can click one of them to inspect that site.

the first step is probably to check the `deploys` tab to see the logs for the most recent build. clicking on one of the deploys in the list will bring up its build log.

the `site settings` tab also has a lot of useful configuration options. that is the next place to look if you need to reconfigure the deployment in any way.
