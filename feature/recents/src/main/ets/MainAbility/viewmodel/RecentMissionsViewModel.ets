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

import featureAbility from '@ohos.ability.featureAbility';
import launcherAbilityManager from '../../../../../../../common/src/main/ets/default/manager/LauncherAbilityManager';
import amsMissionManager from '../../../../../../../common/src/main/ets/default/manager/AmsMissionManager';
import LayoutConfigManager from '../../../../../../../common/src/main/ets/default/layoutconfig/LayoutConfigManager';
import Log from '../../../../../../../common/src/main/ets/default/utils/Log';
import RecentMissionInfo from '../../../../../../../common/src/main/ets/default/bean/RecentMissionInfo';
import RecentMissionsModel from '../../../../../../../common/src/main/ets/default/model/RecentMissionsModel';
import RecentModeFeatureConfig from '../common/layoutconfig/RecentModeFeatureConfig';
import windowManager from '../../../../../../../common/src/main/ets/default/manager/WindowManager';

const TAG = 'RecentMissionsViewModel';

/**
 * Class RecentMissionsViewModel.
 */
export default class RecentMissionsViewModel {
  private mRecentMissionsModel: RecentMissionsModel;
  private mRecentModeFeatureConfig: RecentModeFeatureConfig;
  private mRecentMissionsLimit: number;
  private mRecentMissionsList: RecentMissionInfo[] = [];

  private constructor() {
    Log.showInfo(TAG, 'constructor start');
    this.mRecentMissionsModel = RecentMissionsModel.getInstance();
    let config = LayoutConfigManager.getModeConfig(RecentModeFeatureConfig.RECENT_MISSIONS_MODE_CONFIG);
    if (config instanceof RecentModeFeatureConfig) {
      this.mRecentModeFeatureConfig = <RecentModeFeatureConfig>config;
      this.mRecentMissionsLimit = this.mRecentModeFeatureConfig.getRecentMissionsLimit();
    }
  }

  /**
   * Delete recent missions.
   *
   */
  private async deleteRecentMissions(): Promise<void> {
    await amsMissionManager.clearAllMissions();
  }

  /**
   * Set lock mission state into amsMissionManager.
   *
   * @param {number} missionId
   */
  private async lockMission(missionId: number): Promise<void> {
    Log.showInfo(TAG, 'lockMission start');
    await amsMissionManager.lockMission(missionId);
  }

  /**
   * Set unlock mission state into amsMissionManager.
   *
   * @param {number} missionId
   */
  private async unlockMission(missionId: number): Promise<void> {
    Log.showInfo(TAG, 'unlockMission start');
    await amsMissionManager.unlockMission(missionId);
  }

  /**
   * Get the recent mission view model object.
   *
   * @return {object} recent mission view model singleton
   */
  static getInstance(): RecentMissionsViewModel {
    if (globalThis.RecentMissionsViewModelInstance == null) {
      globalThis.RecentMissionsViewModelInstance = new RecentMissionsViewModel();
    }
    return globalThis.RecentMissionsViewModelInstance;
  }

  /**
   * Get the recent mission row type.
   *
   * @return {string} row type
   */
  getRecentMissionsRowType(): string {
    return this.mRecentModeFeatureConfig.getRecentMissionsRowType();
  }

  /**
   * Callback function of getRecentMissionsList.
   */
  async getRecentMissionsList(): Promise<void> {
    Log.showInfo(TAG, 'getRecentMissionsList start');
    this.mRecentMissionsList = await amsMissionManager.getRecentMissionsList();
    Log.showInfo(TAG, `getRecentMissionsList length: ${this.mRecentMissionsList.length}`);
    AppStorage.SetOrCreate('recentMissionsList', this.mRecentMissionsList);
  }

  /**
   * Delete recent mission.
   *
   * @param {boolean} isClickDelBtn - The flag of click delete button.
   * @param {number} missionId - The missionId of current recent mission.
   */
  async deleteRecentMission(isClickDelBtn: boolean, missionId: number): Promise<void> {
    Log.showInfo(TAG, `deleteRecentMissions missionId: ${missionId}`);
    if (!isClickDelBtn && missionId != -1) {
      await amsMissionManager.clearMission(missionId);
      for (let iRecentMissionsIndex = 0; iRecentMissionsIndex < this.mRecentMissionsList.length; iRecentMissionsIndex++) {
        if (this.mRecentMissionsList[iRecentMissionsIndex].missionId === missionId) {
          this.mRecentMissionsList.splice(iRecentMissionsIndex, 1);
          break;
        }
      }
    } else {
      this.mRecentMissionsList = [];
      AppStorage.SetOrCreate('recentMissionsList', this.mRecentMissionsList);
      await this.deleteRecentMissions();
      return;
    }
    animateTo({
      duration: 200,
      curve: Curve.EaseInOut,
      delay: 100,
      playMode: PlayMode.Normal,
      tempo: 0.5,
      iterations: 1,
      onFinish: () => {
      }
    }, () => {
      AppStorage.SetOrCreate('recentMissionsList', this.mRecentMissionsList);
    });
    if(this.mRecentMissionsList.length == 0) {
      this.terminateRecentIfAllClear();
    }
  }

  /**
   * Set recent mission locked status.
   *
   * @param {string} missionId - The missionId of current recent mission.
   * @param {boolean} lockedState - The lockedState of current recent mission.
   */
  async setRecentMissionLock(missionId: number, lockedState: boolean): Promise<void> {
    Log.showInfo(TAG, `setRecentMissionLock missionId: ${missionId}, lockedState: ${String(lockedState)}`);
    if (lockedState) {
      void this.lockMission(missionId);
    } else {
      void this.unlockMission(missionId);
    }
    void this.getRecentMissionsList();
  }

  /**
   * Get mission snapshot
   *
   * @param missionId - The missionId of current recent mission.
   *
   * @return snapshot - The snapshot of current recent mission.
   */
  async getMissionSnapShot(missionId: number, callback?: any) {
    Log.showInfo(TAG, `getMissionSnapShot missionId: ${missionId}`);
    let snapShot = await amsMissionManager.getMissionSnapShot(missionId);
    if (callback != undefined) {
      callback(missionId, snapShot);
    } else {
      return snapShot;
    }
  }

  /**
   * Move the recent mission to front
   *
   * @param missionId - The missionId of current recent mission.
   */
  async moveMissionToFront(missionId: number): Promise<void> {
    await amsMissionManager.moveMissionToFront(missionId);
  }

  /**
   * Terminate recent if clear all missions.
   */
  terminateRecentIfAllClear(): void {
    Log.showInfo(TAG, 'terminateRecentIfAllClear all recent cleared');
    windowManager.hideWindow(windowManager.RECENT_WINDOW_NAME);
  }

  /**
   * Back to desktop.
   */
  backView(): void {
    Log.showInfo(TAG, 'backView start');
    windowManager.hideWindow(windowManager.RECENT_WINDOW_NAME);
  }
}