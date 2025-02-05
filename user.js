const puppeteer = require('puppeteer');
const utils = require('./utils');


function getUserPageUrl (username){
  const url = `https://twitter.com/${username}`;
  return url;
}

/*
 * Fetch user profile
 */
async function getProfile(screenName){
  browser = null;
  let result = {};
  async function getUserByScreenName(response){
    try {
      if (response.url().indexOf("UserByScreenName") > 0){
        const text = await response.text();
        const json = JSON.parse(text);
        result = json.data.user.result.legacy;
        result.user_id_str = json.data.user.result.rest_id;
        page.off('response', getUserByScreenName);
      }
    } catch (error) {
    }
  }
  const url = getUserPageUrl(screenName);
  browser = await puppeteer.launch();
  const [page] = await browser.pages();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
  )

  page.on('response', getUserByScreenName);
  await page.goto(url, {waitUntil: 'networkidle0'});
  await browser.close();
  return result;
}
exports.getProfile = getProfile;

/*
 * Fetch user timeline
 */
async function getTimeline(screenName, scroll){
  let result = {};
  async function getTimelineRes(response){
    try {
      if (response.url().indexOf("UserTweets") >= 0){
        const text = await response.text();
        const json = JSON.parse(text);
        json.data.user.result.timeline_v2.timeline.instructions.forEach(instruction => {
          if (instruction.type == "TimelineAddEntries") {
            instruction.entries.forEach(entry => {
              if (!!entry.content.itemContent) {
                Object.assign(result, entry.content.itemContent.tweet_results.result.legacy)
              }
            })
            }
        })
      }
    } catch (error) {
    }
  }
  const url = getUserPageUrl(screenName);
  browser = await puppeteer.launch();
  const [page] = await browser.pages();
  page.on('response', getTimelineRes);
  await page.goto(url, {waitUntil: 'networkidle2'});
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
  )
  await utils.autoScroll(page);
  await browser.close();
  return result;
}
exports.getTimeline = getTimeline;
