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

import LayoutConfigManager from '../../../../../../../common/src/main/ets/default/layoutconfig/LayoutConfigManager';
import StyleConstants from '../../../../../../../common/src/main/ets/default/constants/StyleConstants';
import ResourceManager from '../../../../../../../common/src/main/ets/default/manager/ResourceManager';
import MenuInfo from '../../../../../../../common/src/main/ets/default/bean/MenuInfo';
import CommonConstants from '../../../../../../../common/src/main/ets/default/constants/CommonConstants';
import AppGrid from '../../../../../../../common/src/main/ets/default/uicomponents/AppGrid.ets';
import UninstallDialog from '../../../../../../../common/src/main/ets/default/uicomponents/UninstallDialog.ets';
import AppGridPresenter from '../common/presenter/AppGridPresenter';
import AppCenterGridStyleConfig from '../common/AppCenterGridStyleConfig';
import FeatureConstants from '../common/constants/FeatureConstants';
import localEventManager from '../../../../../../../common/src/main/ets/default/manager/LocalEventManager';
import EventConstants from '../../../../../../../common/src/main/ets/default/constants/EventConstants';
import Trace from '../../../../../../../common/src/main/ets/default/utils/Trace';
import AppCenterViewModel from '../common/viewmodel/AppCenterViewModel.ets';
import windowManager from '../../../../../../../common/src/main/ets/default/manager/WindowManager';
import Log from '../../../../../../../common/src/main/ets/default/utils/Log'

const TAG = 'AppGridLayout'

@Component
export default struct AppGridLayout {
  @State mColumns: number = StyleConstants.DEFAULT_APP_GRID_COLUMN;
  @State mRows: number = StyleConstants.DEFAULT_APP_GRID_ROW;
  @StorageLink('listInfo') appGridList: [] = [];
  mAppGridPresenter: AppGridPresenter = null;
  mAppCenterGridStyleConfig: AppCenterGridStyleConfig = null;
  mSelectItem = null;
  private dialogName: string = "";
  mDialogController: CustomDialogController = new CustomDialogController({
    builder: UninstallDialog({
      cancel: () => {
      },
      confirm: () => {
        this.onAccept()
      },
      dialogName: this.dialogName,
      dialogContent: this.mSelectItem.appName + ' ?',
    }),
    cancel: () => {
    },
    autoCancel: true,
    customStyle: true
  });

  onAccept() {
    if (this.mSelectItem == null) {
      return;
    }
    this.mAppGridPresenter.uninstallApp(this.mSelectItem.bundleName, this.mSelectItem.isUninstallAble);
    this.mDialogController.close();
  }

  aboutToDisappear(): void {
    Log.showInfo(TAG, "aboutToDisappear")
  }

  aboutToAppear(): void {
    Log.showInfo(TAG, "aboutToAppear")
    this.mAppGridPresenter = AppGridPresenter.getInstance();
    this.mAppGridPresenter.getAppList();
    this.mAppCenterGridStyleConfig = AppCenterViewModel.getInstance().getAppGridStyleConfig();
    ResourceManager.getInstance().getStringByResource($r('app.string.app_center_menu_uninstall')).then((resName) => {
      this.dialogName = resName;
    });
  }

  public buildMenuInfoList(appInfo) {
    let menuInfoList = new Array<MenuInfo>();
    let shortcutInfo = this.mAppGridPresenter.getShortcutInfo(appInfo.bundleName);
    if (shortcutInfo) {
      let Menu = null;
      shortcutInfo.forEach((value) => {
        Menu = new MenuInfo();
        Menu.menuType = CommonConstants.MENU_TYPE_DYNAMIC;
        Menu.menuImgSrc = value.icon;
        Menu.menuText = value.label;
        Menu.shortcutIconId = value.iconId;
        Menu.shortcutLabelId =  value.labelId;
        Menu.bundleName = value.bundleName;
        Menu.onMenuClick = () => {
          this.mAppGridPresenter.jumpTo(value.wants[0].targetClass, value.wants[0].targetBundle);
        };
        menuInfoList.push(Menu);
      });
    }

    let open = new MenuInfo();
    open.menuType = CommonConstants.MENU_TYPE_FIXED;
    open.menuImgSrc = "/common/pics/ic_public_add_norm.svg";
    open.menuText = $r('app.string.app_menu_open');
    open.onMenuClick = () => {
      this.mAppGridPresenter.jumpTo(appInfo.abilityName, appInfo.bundleName);
    };
    menuInfoList.push(open);

    let addToDockMenu = new MenuInfo();
    addToDockMenu.menuType = CommonConstants.MENU_TYPE_FIXED;
    addToDockMenu.menuImgSrc = "/common/pics/ic_public_copy.svg";
    addToDockMenu.menuText = $r('app.string.app_center_menu_add_dock');
    addToDockMenu.onMenuClick = () => {
      Log.showInfo(TAG, "Launcher click menu item add to smartDock entry");
      localEventManager.sendLocalEventSticky(EventConstants.EVENT_REQUEST_DOCK_ITEM_ADD, appInfo);
    };
    menuInfoList.push(addToDockMenu);

    let addToDeskMenu = new MenuInfo();
    addToDeskMenu.menuType = CommonConstants.MENU_TYPE_FIXED;
    addToDeskMenu.menuImgSrc = "/common/pics/ic_public_copy.svg";
    addToDeskMenu.menuText = $r('app.string.app_center_menu_add_desktop');
    addToDeskMenu.onMenuClick = () => {
      Log.showInfo(TAG, "Launcher click menu item add to pageDesk entry");
      localEventManager.sendLocalEventSticky(EventConstants.EVENT_REQUEST_PAGEDESK_ITEM_ADD, appInfo);
    };
    menuInfoList.push(addToDeskMenu);

    let uninstallMenu = new MenuInfo();
    uninstallMenu.menuType = CommonConstants.MENU_TYPE_FIXED;
    uninstallMenu.menuImgSrc = "/common/pics/ic_public_delete.svg";
    uninstallMenu.menuText = $r('app.string.uninstall');
    uninstallMenu.onMenuClick = () => {
      Log.showInfo(TAG, "Launcher click menu item uninstall" + JSON.stringify(appInfo));
      let cacheKey = appInfo.appLabelId + appInfo.bundleName;
      let appName = this.mAppGridPresenter.getAppName(cacheKey);
      Log.showInfo(TAG, "Launcher AppGridLayout buildMenuInfoList appName" + appName);
      if (appName != null) {
        appInfo.appName = appName;
      }
      this.mSelectItem = appInfo;
      this.mDialogController.open();
    };
    uninstallMenu.menuEnabled = appInfo.isUninstallAble;
    menuInfoList.push(uninstallMenu);
    return menuInfoList;
  }

  build() {
    Column() {
      Row() {
        AppGrid({
          appGridList: $appGridList,
          isScroll: true,
          appGridStyleConfig: this.mAppCenterGridStyleConfig,
          onItemClick: (event, item) => {
            this.mAppGridPresenter.jumpTo(item.abilityName, item.bundleName);
          },
          buildMenu: (item) => this.buildMenuInfoList(item)
        })
      }.width(this.mAppCenterGridStyleConfig.mGridWidth)
      .height(this.mAppCenterGridStyleConfig.mGridHeight)

      Row() {

      }.width(216)
      if (this.traceBuildEnd()) {}
    }
    .padding({
      top: this.mAppCenterGridStyleConfig.mPadding
    })
    .backgroundImageSize(ImageSize.Cover)
    .width(StyleConstants.PERCENTAGE_100)
    .height(StyleConstants.PERCENTAGE_100)
  }

  private traceBuildEnd() {
    Trace.end(Trace.CORE_METHOD_START_APP_CENTER);
    return true;
  }
}
