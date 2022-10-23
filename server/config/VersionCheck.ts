/*  nodejs-poolController.  An application to control pool equipment.
Copyright (C) 2016, 2017, 2018, 2019, 2020.  Russell Goldin, tagyoureit.  russ.goldin@gmail.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import * as path from "path";
import * as fs from "fs";
const extend = require("extend");
import { logger } from "../logger/Logger";
// import { https } from "follow-redirects";
import * as https from 'https';
// import { AppVersionState, state } from "../controller/State";
// import { sys } from "../controller/Equipment";
// import { Timestamp } from "../controller/Constants";
import { execSync } from 'child_process';
import { config } from './Config';
import { Timestamp } from '../Constants';
class VersionCheck {
  private userAgent: string;
  private gitApiHost: string;
  private gitLatestReleaseJSONPath: string;
  private redirects: number;
  constructor() {
    this.userAgent = 'tagyoureit-nodejs-poolController-dashPanel-app';
    this.gitApiHost = 'api.github.com';
    this.gitLatestReleaseJSONPath = '/repos/rstrouse/nodejs-poolController-dashPanel/releases/latest';
  }

  public checkGitRemote() {
    let c = config.getSection('appVersion');
    // need to significantly rate limit this because GitHub will start to throw 'too many requests' error
    // and we simply don't need to check that often if the app needs to be updated
    if (typeof c.nextCheckTime === 'undefined' || new Date() > new Date(c.nextCheckTime)) this.checkAll();
    this.checkGitLocal();
    c = config.getSection('appVersion');
    return c;
  }
  public checkGitLocal() {
    // check local git version
    let c = config.getSection('appVersion');
    let env = process.env;
    let out: string;
    try {
      if (typeof env.SOURCE_BRANCH !== 'undefined') {
        out = env.SOURCE_BRANCH // check for docker variable
      }
      else {
        let res = execSync('git rev-parse --abbrev-ref HEAD');
        out = res.toString().trim();
      }
      logger.info(`The current git local branch output is ${out}`);
      switch (out) {
        case 'fatal':
        case 'command':
          c.gitLocalBranch = '--';
          break;
        default:
          c.gitLocalBranch = out;
      }
    }
    catch (err) { logger.error(`Unable to retrieve local git branch.  ${err}`); }
    try {
      if (typeof env.SOURCE_COMMIT !== 'undefined') {
        out = env.SOURCE_COMMIT; // check for docker variable
      }
      else {
        let res = execSync('git rev-parse HEAD');
        out = res.toString().trim();
      }
      logger.info(`The current git local commit output is ${out}`);
      switch (out) {
        case 'fatal':
        case 'command':
          c.gitLocalCommit = '--';
          break;
        default:
          c.gitLocalCommit = out;
      }
    }
    catch (err) {
      logger.error(`Unable to retrieve local git commit.  ${err}`);
    }
    config.setSection('appVersion', c);

  }
  private checkAll() {
    try {
      let c = config.getSection('appVersion');
      this.redirects = 0;
      let dt = new Date();
      dt.setDate(dt.getDate() + 2); // check every 2 days
      c.nextCheckTime = Timestamp.toISOLocal(dt);
      this.getLatestRelease().then((publishedVersion) => {
        c.githubRelease = publishedVersion;
        config.setSection('appVersion', c);
        this.compare();
      }).catch((err) => {
        logger.warn(`Error get git latest release: ${err}`);
      });
    }
    catch (err) {
      logger.error(err);
    }
  }

  private async getLatestRelease(redirect?: string): Promise<string> {
    var options = {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent
      }
    }
    let url: string;
    if (typeof redirect === 'undefined') {
      url = `https://${this.gitApiHost}${this.gitLatestReleaseJSONPath}`;
    }
    else {
      url = redirect;
      this.redirects += 1;
    }
    if (this.redirects >= 20) return Promise.reject(`Too many redirects.`)

      return new Promise<string>(async (resolve, reject) => {

          let r = https.request(url, options, async res => {
            if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) await this.getLatestRelease(res.headers.location);
            let data = '';
            res.on('data', d => { data += d; })
              .on('end', () => {
                let jdata = JSON.parse(data);
                if (typeof jdata.tag_name !== 'undefined')
                  resolve(jdata.tag_name.replace('v', ''));
                else
                  reject(`No data returned.`)
              })
              .on('error', (err) => {
                logger.error(`Error with getLatestRelease: ${err.message}`);
              })

          })
            .end();
          r.on('error', (err) => {
            logger.error(`here??? ${err.message}`);
          })

      })

  }
  public compare() {
    logger.info(`Checking dashPanel versions...`);
    let c = config.getSection('appVersion');
    if (typeof c.githubRelease === 'undefined' || typeof c.installed === 'undefined') {
      c.status = 'unknown';
      logger.warn(`Unable to compare installed version to github version.`)
      config.setSection('appVersion', c);
      return;
    }
    let publishedVersionArr = c.githubRelease.split('.');
    let installedVersionArr = c.installed.split('.');
    if (installedVersionArr.length !== publishedVersionArr.length) {
      // this is in case local a.b.c doesn't have same # of elements as another version a.b.c.d.  We should never get here.
      logger.warn(`Cannot check for updated app.  Version length of installed app (${installedVersionArr}) and remote (${publishedVersionArr}) do not match.`);
      c.status = 'unknown';
      config.setSection('appVersion', c);
      return;
    } else {
      for (var i = 0; i < installedVersionArr.length; i++) {
        if (publishedVersionArr[i] > installedVersionArr[i]) {
          c.status = 'behind';
          logger.info(`New version available. Current:${c.installed} Github:${c.githubRelease}`);
          config.setSection('appVersion', c);
          return;
        } else if (publishedVersionArr[i] < installedVersionArr[i]) {
          c.status = 'ahead';
          logger.info(`Currently running a newer version than released version. Current:${c.installed} Github:${c.githubRelease}`);
          config.setSection('appVersion', c);
          return;
        }
      }
    }
    c.status = 'current';
    logger.info(`Current installed dashPanel version matches Github release.  ${c.installed}`)
    config.setSection('appVersion', c);
  }
}
export var versionCheck = new VersionCheck();