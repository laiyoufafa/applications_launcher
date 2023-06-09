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

import AppItemInfo from '../bean/AppItemInfo';
import AppListStyleConfig from '../layoutconfig/AppListStyleConfig';
import AppIcon from './AppIcon.ets';
import AppName from './AppName.ets';
import AppMenu from './AppMenu.ets';
import CommonConstants from '../constants/CommonConstants';
import StyleConstants from '../constants/StyleConstants';
import ScrollerComponent from './ScrollerComponent.ets';
import ResourceManager from '../manager/ResourceManager';
import CheckEmptyUtils from '../utils/CheckEmptyUtils';
import Log from '../utils/Log';

let mAppListStyleConfig: AppListStyleConfig = null;
const TAG = 'AppList';

@Component
export default struct AppList {
  @StorageLink('sysUiRecentOnClickEvent') @Watch('sysUiRecentOnClick') sysUiRecentOnClickEvent: number = 0;
  @State isHover: boolean = false;
  @State showPopup: boolean = false;
  @State onHoverItem: string = '';
  @Link appList: Array<AppItemInfo>;
  appListStyleConfig: AppListStyleConfig;
  onItemClick: Function = null;
  onItemLongPress: Function = null;
  buildMenu: Function = null;
  onHoverEvent: Function = null;
  isScrollHover: boolean = false;
  popup: {
    show: boolean,
    showItem: string,
    popup
  } = { show: false, showItem: '', popup: null };
  onClickWithPopup: boolean = false;
  autoCancel: boolean = false;
  private updateData: Function = null;

  private aboutToAppear(): void {
    mAppListStyleConfig = this.appListStyleConfig;
  }

  private sysUiRecentOnClick() {
    this.showPopup = false;
    this.popup = { show: false, showItem: '', popup: null };
  }

  @Builder popupBuilder() {
    Column() {
      ScrollerComponent({
        popupHide: () => {
          this.showPopup = false;
          this.popup = { show: false, showItem: '', popup: null };
        },
        updateData: (show, bundleName, callback) => {
          this.updateData = () => {
            callback();
            setTimeout(() => {
              this.onHoverEvent(true, bundleName);
            }, 100)
          }
          if (show) {
            this.updateData();
            this.getShowPopup();
            return;
          }
          this.showPopup = false;
          this.popup = { show: false, showItem: '', popup: null };
        }
      })
    }.onHover((isScrollHover: boolean) => {
      this.autoCancel = false;
      if (isScrollHover) {
        this.isScrollHover = true;
      } else {
        this.isScrollHover = false;
      }
      this.getShowPopup();
    })
    .onClick(() => {
      this.getShowPopup();
    })
  }

  async getShowPopup() {
    await this.delay(500);
    if (this.popup.show || this.isScrollHover) {
      this.showPopup = true;
    } else {
      this.showPopup = false;
    }
    return this.showPopup;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  build() {
    List({ space: mAppListStyleConfig.mListItemGap }) {
      ForEach(this.appList, (item) => {
        ListItem() {
          if (mAppListStyleConfig.mNameDisplaySide) {
            HorizontalListItem({
              appInfo: item,
              buildMenu: this.buildMenu,
              itemOffset: mAppListStyleConfig.mItemOffset
            })
          } else {
            VerticalListItem({
              appInfo: item,
              onItemLongPress: this.onItemLongPress
            })
          }
        }
        .bindPopup(this.showPopup && item.bundleName == this.onHoverItem && !AppStorage.Get('smartDockShowMenu') as boolean, {
          builder: this.popupBuilder,
          placement: Placement.Top,
          enableArrow: true,
          autoCancel: this.autoCancel,
          maskColor: ('rgba(250,250,250,0)'),
          popupColor: ('rgba(250,250,250,0.6)'),
          onStateChange: (e) => {
            if (!e.isVisible && this.autoCancel) {
              this.popup = { show: false, showItem: '', popup: null };
              this.onHoverItem = '';
              this.onClickWithPopup = false;
              this.autoCancel = false;
              this.showPopup = false;
              AppStorage.SetOrCreate('snapshotList', []);
              AppStorage.SetOrCreate('recentShowPopup', false);
            }
            if (this.updateData) {
              this.updateData();
              this.updateData = () => {
              }
            }
          }
        })
        .onHover((isHover) => {
          this.autoCancel = false;
          if (this.onHoverEvent) {
            this.onHoverEvent(isHover, item.bundleName);
            this.onHoverItem = item.bundleName;
            this.getShowPopup();
          }
        })
        .onClick((event: ClickEvent) => {
          this.onItemClick(event, item);
          this.onClickWithPopup = AppStorage.Get('recentShowPopup');
          Log.showInfo(TAG, `onClick this.onClickWithPopup: ${this.onClickWithPopup}`);
          if (this.onClickWithPopup) {
            this.autoCancel = true;
            this.showPopup = true
            this.onHoverItem = item.bundleName;
          }
          AppStorage.SetOrCreate('recentShowPopup', false);
        })
      }, (item) => JSON.stringify(item))
    }
    .width(StyleConstants.PERCENTAGE_100)
    .height(StyleConstants.PERCENTAGE_100)
    .listDirection(mAppListStyleConfig.mListDirection)
  }
}

@Component
struct HorizontalListItem {
  @State isShow: boolean = false;
  appInfo: AppItemInfo = null;
  buildMenu: Function = null;
  itemOffset: {} = { x: 0, y: 0 }
  private menuInfo;

  private aboutToAppear(): void {
    this.menuInfo = this.buildMenu(this.appInfo);
  }

  private getLongPress(): boolean {
    return AppStorage.Get('isLongPress');
  }

  @Builder MenuBuilder() {
    Flex({ direction: FlexDirection.Column, justifyContent: FlexAlign.Center, alignItems: ItemAlign.Center }) {
      AppMenu({
        menuInfoList: this.menuInfo
      })
    }
    .width(StyleConstants.CONTEXT_MENU_WIDTH)
    .height(StyleConstants.DEFAULT_40 * this.menuInfo.length + StyleConstants.DEFAULT_8)
  }

  build() {
    if (this.menuInfo.length > 0) {
      Column() {
        AppItem({
          appInfo: this.appInfo
        })
      }
      .gesture(
      LongPressGesture({ repeat: false })
        .onAction((event: GestureEvent) => {
          this.isShow = true;
        })
      )
      .bindPopup(this.isShow, {
        builder: this.MenuBuilder,
        placement: Placement.Top,
        popupColor: Color.White,
        onStateChange: (e) => {
          if (!e.isVisible) {
            this.isShow = false;
          }
          AppStorage.SetOrCreate('smartDockShowMenu', e.isVisible)
        },
        autoCancel: true
      })
      .onTouch((event: TouchEvent) => {
        if (event.type == CommonConstants.TOUCH_TYPE_MOVE && this.getLongPress()) {
          this.isShow = false;
        }
      })
      .onMouse((event: MouseEvent) => {
        if (event.button == MouseButton.Right) {
          event.stopPropagation();
          Log.showInfo(TAG, 'onMouse MouseButton Right');
          AppStorage.SetOrCreate('selectDesktopAppItem', null);
          this.isShow = true;
        }
      })
      .offset(this.itemOffset)
    } else {
      Column() {
        AppItem({
          appInfo: this.appInfo
        })
      }
    }

  }
}

@Component
struct VerticalListItem {
  appInfo: AppItemInfo = null;
  onItemLongPress: Function = null;

  build() {
    Column() {
      AppIcon({
        iconSize: mAppListStyleConfig.mIconSize,
        appIcon: this.appInfo.appIconId,
        icon: ResourceManager.getInstance().getCachedAppIcon(this.appInfo.appIconId, this.appInfo.bundleName),
        bundleName: this.appInfo.bundleName,
        badgeNumber: CommonConstants.BADGE_DISPLAY_HIDE
      })
      if (mAppListStyleConfig.mWithAppName) {
        Column() {
          AppName({
            nameHeight: mAppListStyleConfig.mNameHeight,
            nameSize: mAppListStyleConfig.mNameSize,
            nameFontColor: mAppListStyleConfig.mNameFontColor,
            bundleName: this.appInfo.bundleName,
            appName: this.appInfo.appName,
            labelId: this.appInfo.appLabelId
          })
        }
        .margin({
          top: mAppListStyleConfig.mNameIconGap
        })
      }
    }
    .gesture(
    LongPressGesture({ repeat: false })
      .onAction((event: GestureEvent) => {
        if (this.onItemLongPress != null) {
          this.onItemLongPress(event, this.appInfo);
        }
      })
    )
    .width(mAppListStyleConfig.mListItemWidth)
    .height(mAppListStyleConfig.mListItemHeight)
    .padding(mAppListStyleConfig.mItemPadding)
    .backgroundColor(mAppListStyleConfig.mItemBackgroundColor)
    .borderRadius(mAppListStyleConfig.mItemBorderRadius)
  }
}

@Component
struct AppItem {
  appInfo: AppItemInfo = null;

  build() {
    Row() {
      AppIcon({
        iconSize: mAppListStyleConfig.mIconSize,
        appIcon: this.appInfo.appIconId,
        icon: ResourceManager.getInstance().getCachedAppIcon(this.appInfo.appIconId, this.appInfo.bundleName),
        bundleName: this.appInfo.bundleName,
        badgeNumber: CommonConstants.BADGE_DISPLAY_HIDE
      })
      if (mAppListStyleConfig.mWithAppName) {
        Row() {
          AppName({
            nameHeight: mAppListStyleConfig.mNameHeight,
            nameSize: mAppListStyleConfig.mNameSize,
            nameFontColor: mAppListStyleConfig.mNameFontColor,
            bundleName: this.appInfo.bundleName,
            appName: this.appInfo.appName,
            labelId: this.appInfo.appLabelId
          })
        }
        .margin({
          left: mAppListStyleConfig.mNameIconGap
        })
      }
    }
    .width(mAppListStyleConfig.mListItemWidth)
    .height(mAppListStyleConfig.mListItemHeight)
    .backgroundColor(mAppListStyleConfig.mItemBackgroundColor)
    .borderRadius(mAppListStyleConfig.mItemBorderRadius)
  }
}