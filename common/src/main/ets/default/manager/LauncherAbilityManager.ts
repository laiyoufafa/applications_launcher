/**
 * Copyright (c) 2021-2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import bundleMgr from '@ohos.bundle';
import {LauncherAbilityInfo} from 'bundle/launcherAbilityInfo';
import launcherBundleMgr from '@ohos.bundle.innerBundleManager';
import formManagerAbility from '@ohos.ability.formManager';
import AppItemInfo from '../bean/AppItemInfo';
import CheckEmptyUtils from '../utils/CheckEmptyUtils';
import CommonConstants from '../constants/CommonConstants';
import EventConstants from '../constants/EventConstants';
import ResourceManager from './ResourceManager';
import osaccount from '@ohos.account.osAccount'
import Trace from '../utils/Trace';
import Log from '../utils/Log';

const TAG = 'LauncherAbilityManager';

/**
 * 桌面应用管理类
 */
class LauncherAbilityManager {
  private static readonly CURRENT_USER_ID = -2;
  private static readonly BUNDLE_STATUS_CHANGE_KEY = 'BundleStatusChange';
  private readonly mAppMap = new Map<string, AppItemInfo>();
  private mUserId: number = 100;

  private readonly mBundleStatusCallback: BundleStatusCallback = {
    add: (bundleName, userId) => {
      Log.showInfo(TAG, `mBundleStatusCallback add bundleName: ${bundleName}, userId: ${userId}, mUserId ${this.mUserId}`);
      this.mUserId == userId && this.notifyLauncherAbilityChange(EventConstants.EVENT_PACKAGE_ADDED, bundleName, userId);
    },
    remove: (bundleName, userId) => {
      Log.showInfo(TAG, `mBundleStatusCallbackremove bundleName: ${bundleName}, userId: ${userId}, mUserId ${this.mUserId}`);
      this.mUserId == userId && this.notifyLauncherAbilityChange(EventConstants.EVENT_PACKAGE_REMOVED, bundleName, userId);
    },
    update: (bundleName, userId) => {
      Log.showInfo(TAG, `mBundleStatusCallbackupdate bundleName: ${bundleName}, userId: ${userId}, mUserId ${this.mUserId}`);
      this.mUserId == userId && this.notifyLauncherAbilityChange(EventConstants.EVENT_PACKAGE_CHANGED, bundleName, userId);
    }
  };

  private readonly mLauncherAbilityChangeListeners: any[] = [];

  /**
   * 获取桌面应用信息管理对象
   *
   * @return 桌面应用信息管理对象单一实例
   */
  static getInstance(): LauncherAbilityManager {
    if (globalThis.LauncherAbilityManagerInstance == null) {
      globalThis.LauncherAbilityManagerInstance = new LauncherAbilityManager();
    }
    Log.showInfo(TAG, 'getInstance!');
    return globalThis.LauncherAbilityManagerInstance;
  }

  private constructor() {
    const osAccountManager = osaccount.getAccountManager();
    osAccountManager.getOsAccountLocalIdFromProcess((err, localId) => {
      Log.showInfo(TAG, "getOsAccountLocalIdFromProcess localId " + localId);
      this.mUserId = localId;
    })
  }

  /**
   * 开始监听系统应用状态.
   *
   * @params listener 监听对象
   */
  registerLauncherAbilityChangeListener(listener: any): void {
    if (listener != null) {
      if (this.mLauncherAbilityChangeListeners.length == 0) {
        launcherBundleMgr.on(LauncherAbilityManager.BUNDLE_STATUS_CHANGE_KEY, this.mBundleStatusCallback).then(data => {
          Log.showInfo(TAG, `registerCallback success: ${JSON.stringify(data)}`);
        }).catch(err => {
          Log.showError(TAG, `registerCallback fail: ${JSON.stringify(err)}`);
        });
      }
      const index = this.mLauncherAbilityChangeListeners.indexOf(listener);
      if (index == CommonConstants.INVALID_VALUE) {
        this.mLauncherAbilityChangeListeners.push(listener);
      }
    }
  }

  /**
   * 取消监听系统应用状态.
   *
   * @params listener 监听对象
   */
  unregisterLauncherAbilityChangeListener(listener: any): void {
    if (listener != null) {
      const index = this.mLauncherAbilityChangeListeners.indexOf(listener);
      if (index != CommonConstants.INVALID_VALUE) {
        this.mLauncherAbilityChangeListeners.splice(index, 1);
      }
      if (this.mLauncherAbilityChangeListeners.length == 0) {
        launcherBundleMgr.off(LauncherAbilityManager.BUNDLE_STATUS_CHANGE_KEY).then(data => {
          Log.showInfo(TAG, 'unregisterCallback success');
        }).catch(err => {
          Log.showError(TAG, `unregisterCallback fail: ${JSON.stringify(err)}`);
        });
      }
    }
  }

  private notifyLauncherAbilityChange(event, bundleName: string, userId): void {
    for (let index = 0; index < this.mLauncherAbilityChangeListeners.length; index++) {
      this.mLauncherAbilityChangeListeners[index](event, bundleName, userId);
    }
  }

  /**
   * get all app List info from BMS
   */
  async getLauncherAbilityList(): Promise<AppItemInfo[]> {
    let abilityList = null;
    await launcherBundleMgr.getAllLauncherAbilityInfos(LauncherAbilityManager.CURRENT_USER_ID)
      .then((res) => {
        Log.showInfo(TAG, `getLauncherAbilityList res length: ${res.length}`);
        abilityList = res;
      })
      .catch((err) => {
        Log.showInfo(TAG, `getLauncherAbilityList error: ${JSON.stringify(err)}`);
      });
    const appItemInfoList = new Array<AppItemInfo>();
    if (CheckEmptyUtils.isEmpty(abilityList)) {
      Log.showError(TAG, 'getLauncherAbilityList Empty');
      return appItemInfoList;
    }
    for (let i = 0; i < abilityList.length; i++) {
      let appItem = await this.convertToAppItemInfo(abilityList[i]);
      appItemInfoList.push(appItem);
    }
    return appItemInfoList;
  }

  /**
   * get AbilityInfos by bundleName from BMS
   *
   * @params bundleName 应用包名
   * @return 目标应用的入口Ability信息列表
   */
  async getLauncherAbilityInfo(bundleName: string): Promise<AppItemInfo[]> {
    let abilityInfos: LauncherAbilityInfo[];
    await launcherBundleMgr.getLauncherAbilityInfos(bundleName, LauncherAbilityManager.CURRENT_USER_ID)
      .then((res) => {
        Log.showInfo(TAG, `getLauncherAbilityInfo length: ${res.length}`);
        abilityInfos = res;
      })
      .catch((err) => {
        Log.showInfo(TAG, `getLauncherAbilityInfo error: ${JSON.stringify(err)}`);
      });
    const appItemInfoList = new Array<AppItemInfo>();
    if (CheckEmptyUtils.isEmpty(abilityInfos)) {
      console.error('getLauncherAbilityInfo Empty');
      return appItemInfoList;
    }
    for (let i = 0; i < abilityInfos.length; i++) {
      let appItem = await this.convertToAppItemInfo(abilityInfos[i]);
      appItemInfoList.push(appItem);
    }
    return appItemInfoList;
  }

  /**
   * get AppItemInfo from BMS with bundleName
   * @params bundleName
   * @return AppItemInfo
   */
  async getAppInfoByBundleName(bundleName: string): Promise<AppItemInfo | undefined> {
    let appItemInfo: AppItemInfo | undefined = undefined;
    // get from cache
    if (this.mAppMap != null && this.mAppMap.has(bundleName)) {
      appItemInfo = this.mAppMap.get(bundleName);
    }
    if (appItemInfo != undefined) {
      Log.showInfo(TAG, `getAppInfoByBundleName from cache: ${JSON.stringify(appItemInfo)}`);
      return appItemInfo;
    }
    // get from system
    let abilityInfos = new Array<LauncherAbilityInfo>();
    await launcherBundleMgr.getLauncherAbilityInfos(bundleName, LauncherAbilityManager.CURRENT_USER_ID)
      .then((res)=>{
        if (res != undefined) {
          Log.showInfo(TAG, `getLauncherAbilityInfo res length: ${res.length}`);
          abilityInfos = res;
        }
      })
      .catch((err)=>{
        Log.showInfo(TAG, `getAppInfoByBundleName launcherBundleMgr getLauncherAbilityInfos error: ${JSON.stringify(err)}`);
      });

    if (abilityInfos == undefined || abilityInfos.length == 0) {
      Log.showError(TAG, `${bundleName} has no launcher ability`);
      return undefined;
    }
    const data = await this.convertToAppItemInfoCache(abilityInfos[0]);
    Log.showInfo(TAG, `getAppInfoByBundleName from BMS: ${JSON.stringify(data)}`);
    return data;
  }

  private async convertToAppItemInfoCache(info): Promise<AppItemInfo> {
    const appItemInfo = new AppItemInfo();
    const appLabelId = info.labelId;
    const bundleName = info.elementName.bundleName;
    const appName = info.applicationInfo.label;
    const loadAppName = await ResourceManager.getInstance().getAppNameSync(appLabelId, bundleName, appName);
    appItemInfo.appName = loadAppName;
    appItemInfo.appLabelId = appLabelId;
    appItemInfo.bundleName = bundleName;
    appItemInfo.isSystemApp = info.applicationInfo.systemApp;
    appItemInfo.isUninstallAble = info.applicationInfo.removable;
    appItemInfo.appIconId = info.iconId;
    appItemInfo.abilityName = info.elementName.abilityName;
    await ResourceManager.getInstance().updateIconCache(info.iconId, bundleName);
    this.mAppMap.set(bundleName, appItemInfo);
    return appItemInfo;
  }

  private async convertToAppItemInfo(info): Promise<AppItemInfo> {
    const appItemInfo = new AppItemInfo();
    appItemInfo.appName = info.applicationInfo.label;
    appItemInfo.isSystemApp = info.applicationInfo.systemApp;
    appItemInfo.isUninstallAble = info.applicationInfo.removable;
    appItemInfo.appIconId = info.iconId;
    appItemInfo.appLabelId = info.labelId;
    appItemInfo.bundleName = info.elementName.bundleName;
    appItemInfo.abilityName = info.elementName.abilityName;
    await ResourceManager.getInstance().updateIconCache(appItemInfo.appIconId, appItemInfo.bundleName);
    return appItemInfo;
  }

  /**
   * 卸载应用
   *
   * @params bundleName 应用包名
   * @params callback 卸载回调
   */
  async uninstallLauncherAbility(bundleName: string, callback): Promise<void> {
    Log.showInfo(TAG, `uninstallLauncherAbility bundleName => ${bundleName}`);
    const bundlerInstaller = await bundleMgr.getBundleInstaller();
    bundlerInstaller.uninstall(bundleName, {
      param: {
        userId: 0,
        installFlag: 0,
        isKeepData: false
      }
    }, (result) => {
      callback(result);
    });
  }

  /**
   * 启动应用
   *
   * @params paramAbilityName Ability名
   * @params paramBundleName 应用包名
   */
  startLauncherAbility(paramAbilityName, paramBundleName) {
    Log.showInfo(TAG, `startApplication abilityName => paramAbilityName bundleName: ${paramBundleName}`);
    const result = globalThis.desktopContext.startAbility({
      bundleName: paramBundleName,
      abilityName: paramAbilityName
    }).then(() => {
      Log.showInfo(TAG, 'startApplication promise success');
    }, (err) => {
      Log.showError(TAG, `startApplication promise error: ${JSON.stringify(err)}`);
    });
    Log.showInfo(TAG, `startApplication  AceApplication : startAbility : ${result}`);
    Trace.end(Trace.CORE_METHOD_LAUNCH_APP);
  }

  /**
   * start form config ability
   *
   * @params paramAbilityName
   * @params paramBundleName
   */
  startAbilityFormEdit(paramAbilityName: string, paramBundleName: string, paramCardId: number) {
    Log.showInfo(TAG, `startAbility abilityName: ${paramAbilityName},bundleName: ${paramBundleName},paramCardId: ${paramCardId}`);
    const result = globalThis.desktopContext.startAbility({
      bundleName: paramBundleName,
      abilityName: paramAbilityName,
      parameters:
        {
          formId: paramCardId.toString()
        }
    }).then((ret) => {
      Log.showInfo(TAG, `startAbility ret: ${JSON.stringify(ret)}`);
    }, (err) => {
      Log.showError(TAG, `startAbility catch error: ${JSON.stringify(err)}`);
    });
    Log.showInfo(TAG, `startAbility result: ${JSON.stringify(result)}`);
  }

  async getShortcutInfo(paramBundleName, callback) {
    Log.showInfo(TAG, `getShortcutInfo paramBundleName: ${paramBundleName}`);
    await launcherBundleMgr.getShortcutInfos(paramBundleName)
      .then(shortcutInfo => {
        Log.showInfo(TAG, `getShortcutInfo shortcutInfo: ${shortcutInfo}`);
        callback(paramBundleName, shortcutInfo);
      })
      .catch(err => {
        Log.showError(TAG, `getShortcutInfo ${JSON.stringify(err)}`);
      });
  }

  /**
   * start application by uri
   *
   * @params paramBundleName application bundle name
   * @params paramAbilityName application abilit uri
   */
  startLauncherAbilityByUri(paramBundleName, abilityUri) {
    Log.showInfo(TAG, `startLauncherAbilityByUri bundleName:${paramBundleName} abilityUri:${abilityUri}`);
    const result = globalThis.desktopContext.startAbility({
      bundleName: paramBundleName,
      uri: abilityUri
    }).then(() => {
      Log.showInfo(TAG, 'startLauncherAbilityByUri promise success');
    }, (err) => {
      Log.showError(TAG, `startLauncherAbilityByUri promise error: ${JSON.stringify(err)}`);
    });
    Log.showInfo(TAG, `startLauncherAbilityByUri AceApplication : startAbility : ${result}`);
  }
}

const launcherAbilityManager = LauncherAbilityManager.getInstance();
export default launcherAbilityManager;