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

import windowManager from '../../../../../../common/src/main/ets/default/manager/WindowManager';
import RdbStoreManager from '../../../../../../common/src/main/ets/default/manager/RdbStoreManager';
import LayoutConfigManager from '../../../../../../common/src/main/ets/default/layoutconfig/LayoutConfigManager';
import CommonConstants from '../../../../../../common/src/main/ets/default/constants/CommonConstants';
import CustomOverlay from '../../../../../../common/src/main/ets/default/uicomponents/CustomOverlay.ets';
import PageDesktopModeConfig from '../../../../../../common/src/main/ets/default/layoutconfig/PageDesktopModeConfig';
import LayoutViewModel from '../../../../../../common/src/main/ets/default/viewmodel/LayoutViewModel';
import LocalEventManager from '../../../../../../common/src/main/ets/default/manager/LocalEventManager';
import EventConstants from '../../../../../../common/src/main/ets/default/constants/EventConstants';
import Log from '../../../../../../common/src/main/ets/default/utils/Log';
import SmartDock from '../../../../../../feature/smartdock/src/main/ets/default/layout/SmartDock.ets';
import PageDesktopLayout from '../../../../../../feature/pagedesktop/src/main/ets/default/layout/PageDesktopLayout.ets';
import AppListLayout from '../../../../../../feature/appcenter/src/main/ets/default/layout/AppListLayout.ets';
import FolderOpenComponent from '../../../../../../feature/bigfolder/src/main/ets/default/view/FolderOpenComponent.ets';
import FeatureConstants from '../../../../../../feature/bigfolder/src/main/ets/default/common/constants/FeatureConstants';
import PhoneStage from '../common/PhoneStage';
import StyleConstants from '../common/constants/StyleConstants';
import RecentEvent from '../common/recentEvent';

const TAG = "EntryView";

@Entry
@Component
struct EntryView {
  @StorageLink('screenWidth') screenWidth: number = 0;
  @StorageLink('screenHeight') @Watch('updateScreenInfo') screenHeight: number = 0;
  @StorageLink('AppPageStartConfig') mAppPageStartConfig: string = '';
  @State workSpaceWidth: number = 0;
  @State workSpaceHeight: number = 0;
  @State dockHeight: number = 0;
  @State device: string = 'phone';
  private mStage: PhoneStage = new PhoneStage();
  private mLayoutViewModel: LayoutViewModel;
  private helper: any = null;
  private settingsUriVar: string = '';

  onPageShow(): void {
    Log.showInfo(TAG, 'onPageShow');
    this.mAppPageStartConfig = LayoutConfigManager.getModeConfig<PageDesktopModeConfig>(PageDesktopModeConfig.DESKTOP_MODE_CONFIG).getAppStartPageType();
  }

  private onPageHide(): void {
    Log.showInfo(TAG, 'onPageHide');
  }

  private aboutToAppear(): void  {
    Log.showInfo(TAG, 'aboutToAppear');

    windowManager.getWindowWidth()
      .then((screenWidth) => {
        windowManager.getWindowHeight()
          .then((screenHeight) => {
            AppStorage.SetOrCreate('screenWidth', screenWidth);
            AppStorage.SetOrCreate('screenHeight', screenHeight);
          }).catch((error) => {
          console.error(`windowManager.getWindowHeight Failed to obtain the screenHeight. Cause: ${error.message}`);
        })
      }).catch((error) => {
      console.error(`windowManager.getWindowWidth Failed to obtain the windowWidth. Cause: ${error.message}`);
    })

    this.mStage.onCreate();
    this.mLayoutViewModel = LayoutViewModel.getInstance();
    this.updateScreenSize();

    let dbStore = RdbStoreManager.getInstance();
    dbStore.initRdbConfig();
    AppStorage.SetOrCreate('dockDevice', this.device);
    let mCallback: Record<string, () => void> = {
      "onStateChange": () => this.createRecent()
    };
    RecentEvent.registerCallback(mCallback);
    this.registerPageDesktopNavigatorStatusChangeEvent(this.mLocalEventListener);
  }

  registerPageDesktopNavigatorStatusChangeEvent(listener): void {
    LocalEventManager.registerEventListener(listener, [EventConstants.EVENT_NAVIGATOR_BAR_STATUS_CHANGE]);
  }

  private readonly mLocalEventListener = {
    onReceiveEvent: (event, params) => {
      Log.showInfo(TAG, `receive event: ${event}, params: ${params}`);
      if (event === EventConstants.EVENT_NAVIGATOR_BAR_STATUS_CHANGE) {
        this.updateScreenInfo(params);
      }
    }
  };

  private aboutToDisappear(): void {
    this.mStage.onDestroy();
    Log.showInfo(TAG, 'aboutToDisappear');
  }

  private onBackPress(): void {
    ContextMenu.close();
    AppStorage.SetOrCreate('dialogControllerStatus', !AppStorage.Get('dialogControllerStatus'));
    AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_HIDE);
    AppStorage.SetOrCreate('openFolderStatus', FeatureConstants.OPEN_FOLDER_STATUS_CLOSE);
  }

  private updateScreenInfo(navigationBarStatus?: string) {
    Log.showInfo(TAG, 'updateScreenInfo');
    if (this.screenWidth != 0 && this.screenHeight != 0) {
      this.mLayoutViewModel.initScreen(navigationBarStatus);
      globalThis.SmartDockStyleConfig.initConfig();
      globalThis.PhonePageDesktopGridStyleConfig.initConfig();
      globalThis.BigFolderStyleConfigInstance.initConfig();
      globalThis.FormStyleConfigInstance.initConfig();
      this.updateScreenSize();
    }
  }

  private createRecent(): void {
    Log.showInfo(TAG, 'receive Subscriber success');
    globalThis.createWindowWithName(windowManager.RECENT_WINDOW_NAME, windowManager.RECENT_RANK);
  }

  private async updateScreenSize(): Promise<void> {
    let screenWidth = this.screenWidth;
    let screenHeight = this.screenHeight;
    this.workSpaceHeight = this.mLayoutViewModel.getWorkSpaceHeight();
    this.dockHeight = this.mLayoutViewModel.getDockHeight();
    Log.showInfo(TAG, `updateScreenSize product: ${this.device}, screenWidth: ${screenWidth}, screenHeight: ${screenHeight}`);
    this.workSpaceWidth = screenWidth;
    AppStorage.SetOrCreate('workSpaceWidth', this.workSpaceWidth);
    AppStorage.SetOrCreate('workSpaceHeight', this.workSpaceHeight);
  }

  build() {
    Stack() {
      Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center, justifyContent: FlexAlign.Center }) {
        if (this.mAppPageStartConfig === 'Grid') {
          Column() {
            PageDesktopLayout({
              device: this.device
            });
          }
          .height(this.workSpaceHeight)
          Column() {
            SmartDock()
          }
          .height(this.dockHeight)
        } else {
          AppListLayout();
        }
      }
      FolderOpenComponent()
      CustomOverlay()
    }
    .backgroundImage(StyleConstants.DEFAULT_BACKGROUND_IMAGE)
    .backgroundImageSize(ImageSize.Cover)
    .backgroundImagePosition(Alignment.Center)
    .width('100%')
    .height('100%')
  }
}