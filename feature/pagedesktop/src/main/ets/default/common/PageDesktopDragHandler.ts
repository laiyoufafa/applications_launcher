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

import BaseDragHandler from '../../../../../../../common/src/main/ets/default/base/BaseDragHandler';
import CommonConstants from '../../../../../../../common/src/main/ets/default/constants/CommonConstants';
import PageDesktopViewModel from './viewmodel/PageDesktopViewModel';
import FolderViewModel from '../../../../../../bigfolder/src/main/ets/default/viewmodel/FolderViewModel';
import FormViewModel from '../../../../../../form/src/main/ets/default/viewmodel/FormViewModel';
import Log from '../../../../../../../common/src/main/ets/default/utils/Log';

const TAG = 'PageDesktopDragHandler';

/**
 * 桌面工作区拖拽处理类
 */
export default class PageDesktopDragHandler extends BaseDragHandler {
  private readonly mPageDesktopViewModel: PageDesktopViewModel;
  private readonly mFolderViewModel: FolderViewModel;
  private readonly mFormViewModel: FormViewModel;
  private mGridConfig;
  private mPageCoordinateData = {
    gridXAxis: [],
    gridYAxis: []
  };
  private mStartPosition: any = null;
  private mEndPosition: any = null;
  private readonly styleConfig;
  private mGridItemHeight: any = null;
  private mGridItemWidth: any = null;
  private constructor() {
    super();
    this.mPageDesktopViewModel = PageDesktopViewModel.getInstance();
    this.mFolderViewModel = FolderViewModel.getInstance();
    this.mFormViewModel = FormViewModel.getInstance();
    this.styleConfig = this.mPageDesktopViewModel.getPageDesktopStyleConfig();
  }

  static getInstance(): PageDesktopDragHandler {
    if (globalThis.PageDesktopDragHandler == null) {
      globalThis.PageDesktopDragHandler = new PageDesktopDragHandler();
    }
    return globalThis.PageDesktopDragHandler;
  }

  setDragEffectArea(effectArea): void {
    super.setDragEffectArea(effectArea);
    this.updateGridParam(effectArea);
  }

  private updateGridParam(effectArea) {
    const gridWidth = effectArea.right - effectArea.left;
    const gridHeight = effectArea.bottom - effectArea.top;
    console.info('Launcher PageDesktop updateGridParam gridWidth: ' + gridWidth + ', gridHeight: ' + gridHeight);
    this.mGridConfig = this.mPageDesktopViewModel.getGridConfig();
    const column = this.mGridConfig.column;
    const row = this.mGridConfig.row;
    const columnsGap =  this.mPageDesktopViewModel.getPageDesktopStyleConfig().mColumnsGap;
    const rowGap =  this.mPageDesktopViewModel.getPageDesktopStyleConfig().mRowsGap;
    this.mGridItemHeight = row > 0 ? (gridHeight + columnsGap) / row : 0;
    this.mGridItemWidth = column > 0 ? (gridWidth + rowGap) / column : 0;
    console.info('Launcher PageDesktop updateGridParam column: ' + column + ', row: ' + row);
    this.mPageCoordinateData.gridYAxis = [];
    for (let i = 1; i <= row; i++) {
      const touchPositioningY = (gridHeight / row) * i + effectArea.top;
      this.mPageCoordinateData.gridYAxis.push(touchPositioningY);
    }

    this.mPageCoordinateData.gridXAxis = [];
    for (let i = 1; i <= column; i++) {
      const touchPositioningX = (gridWidth / column) * i + effectArea.left;
      this.mPageCoordinateData.gridXAxis.push(touchPositioningX);
    }
  }

  protected getDragRelativeData(): any {
    const desktopDataInfo: {
      appGridInfo: [[]]
    } = AppStorage.Get('appListInfo');
    return desktopDataInfo.appGridInfo;
  }

  protected getItemIndex(event: any): number {
    const x = event.touches[0].screenX;
    const y = event.touches[0].screenY;
    console.info('Launcher PageDesktop getItemIndex x: ' + x + ', y: ' + y);
    let rowVal = CommonConstants.INVALID_VALUE;
    for (let index = 0; index < this.mPageCoordinateData.gridYAxis.length; index++) {
      if (this.mPageCoordinateData.gridYAxis[index] > y) {
        rowVal = index;
        break;
      }
    }
    let columnVal = CommonConstants.INVALID_VALUE;
    for (let index = 0; index < this.mPageCoordinateData.gridXAxis.length; index++) {
      if (this.mPageCoordinateData.gridXAxis[index] > x) {
        columnVal = index;
        break;
      }
    }
    const column = this.mGridConfig.column;
    if (rowVal != CommonConstants.INVALID_VALUE && columnVal != CommonConstants.INVALID_VALUE) {
      return rowVal * column + columnVal;
    }
    return CommonConstants.INVALID_VALUE;
  }

  protected getItemByIndex(index: number): any {
    const column = index % this.mGridConfig.column;
    const row = Math.floor(index / this.mGridConfig.column);
    console.info('Launcher PageDesktop getItemByIndex column: ' + column + ', row: ' + row);
    const pageIndex: number = this.mPageDesktopViewModel.getIndex();
    const appGridInfo = this.getDragRelativeData();
    console.info('Launcher PageDesktop getItemByIndex pageIndex: ' + pageIndex + ', appGridInfo length: ' + appGridInfo.length);

    const itemInfo = appGridInfo[pageIndex].find(item => {
      if (item.type == CommonConstants.TYPE_APP) {
        return item.column == column && item.row == row;
      } else if (item.type == CommonConstants.TYPE_FOLDER || item.type == CommonConstants.TYPE_CARD) {
        return this.isItemInRowColumn(row, column, item);
      }
    });
    return itemInfo;

  }

  /**
   * judge the item is at target row and column
   * @param row
   * @param column
   * @param item
   */
  private isItemInRowColumn(row, column, item) {
    return item.column <= column && column < item.column + item.area[0] && item.row <= row && row < item.row + item.area[1];
  }

  getCalPosition(x, y): any{
    return this.getTouchPosition(x, y);
  }

  private getTouchPosition(x, y): any {
    const pageIndex =this.mPageDesktopViewModel.getIndex();
    console.info('getTouchPosition pageIndex: ' + pageIndex);
    const position = {
      page: pageIndex,
      row: 0,
      column: 0,
      X: x,
      Y: y,
    };
    for (let i = 0; i < this.mPageCoordinateData.gridXAxis.length; i++) {
      if (x < this.mPageCoordinateData.gridXAxis[i]) {
        position.column = i;
        break;
      } else {
        position.column = this.mPageCoordinateData.gridXAxis.length - 1;
      }
    }
    for (let i = 0; i < this.mPageCoordinateData.gridYAxis.length; i++) {
      if (y < this.mPageCoordinateData.gridYAxis[i]) {
        position.row = i;
        break;
      } else {
        position.row = this.mPageCoordinateData.gridYAxis.length - 1;
      }
    }
    return position;
  }

  protected onDragStart(event: any, itemIndex: number): void {
    Log.showInfo(TAG, 'onDragStart itemIndex: ' + itemIndex);
    super.onDragStart(event, itemIndex);
    const moveAppX = event.touches[0].screenX;
    const moveAppY = event.touches[0].screenY;
    const dragItemInfo = this.getDragItemInfo();

    this.mStartPosition = this.getTouchPosition(moveAppX, moveAppY);
    if (dragItemInfo.type == CommonConstants.TYPE_FOLDER || dragItemInfo.type == CommonConstants.TYPE_CARD) {
      const rowOffset = this.mStartPosition.row - dragItemInfo.row;
      const columnOffset = this.mStartPosition.column - dragItemInfo.column;
      const positionOffset = [columnOffset, rowOffset];
      AppStorage.SetOrCreate('positionOffset', positionOffset);

      const desktopMarginTop = this.mPageDesktopViewModel.getPageDesktopStyleConfig().mDesktopMarginTop;
      const margin = this.mPageDesktopViewModel.getPageDesktopStyleConfig().mMargin;
      const dragItemx = dragItemInfo.column * this.mGridItemWidth + margin;
      const dragItemy = dragItemInfo.row * this.mGridItemHeight + desktopMarginTop;
      const moveOffset = [moveAppX - dragItemx, moveAppY - dragItemy];
      AppStorage.SetOrCreate('moveOffset', moveOffset);

      this.mStartPosition.row = dragItemInfo.row;
      this.mStartPosition.column = dragItemInfo.column;
    }

    AppStorage.SetOrCreate('overlayPositionX', moveAppX);
    AppStorage.SetOrCreate('overlayPositionY', moveAppY);
    if (dragItemInfo.type == CommonConstants.TYPE_APP){
      AppStorage.SetOrCreate('overlayData', {
        iconSize: this.styleConfig.mIconSize * 1.05,
        nameSize: this.styleConfig.mNameSize * 1.05,
        nameHeight: this.styleConfig.mNameHeight * 1.05,
        appInfo: this.getDragItemInfo(),
      });
      AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_APP_ICON);
    } else if (dragItemInfo.type == CommonConstants.TYPE_FOLDER) {
      const folderStyleConfig = this.mFolderViewModel.getFolderStyleConfig();

      const folderSize = folderStyleConfig.mGridSize * 1.05;
      const iconSize = folderStyleConfig.mFolderAppSize * 1.05;
      const gridMargin = folderStyleConfig.mGridMargin * 1.05;
      const gridGap = folderStyleConfig.mFolderGridGap * 1.05;
      AppStorage.SetOrCreate('overlayData', {
        folderHeight: folderSize,
        folderWidth: folderSize,
        folderGridSize: folderSize,
        appIconSize: iconSize,
        gridMargin: gridMargin,
        gridGap: gridGap,
        folderInfo: this.getDragItemInfo()
      });
      AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_FOLDER);
    } else if (dragItemInfo.type == CommonConstants.TYPE_CARD) {
      const formStyleConfig = this.mFormViewModel.getFormStyleConfig();
      const cardDimension = dragItemInfo.cardDimension.toString();
      const formHeight = formStyleConfig.mFormHeight.get(cardDimension) * 1.05;
      const formWidth = formStyleConfig.mFormWidth.get(cardDimension) * 1.05;
      AppStorage.SetOrCreate('overlayData', {
        formHeight: formHeight,
        formWidth: formWidth,
        formInfo: this.getDragItemInfo()
      });
      AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_CARD);
    }

    AppStorage.SetOrCreate('withBlur', false);
  }

  reset(): void {
    super.reset();
  }

  protected onDragMove(event: any, insertIndex: number, itemIndex: number): void {
    super.onDragMove(event, insertIndex, itemIndex);
    console.info('Launcher PageDesktop onDragMove insertIndex: ' + insertIndex);
    const moveAppX = event.touches[0].screenX;
    const moveAppY = event.touches[0].screenY;
    const dragItemInfo = this.getDragItemInfo();
    if (dragItemInfo.type == CommonConstants.TYPE_FOLDER || dragItemInfo.type == CommonConstants.TYPE_CARD) {
      const moveOffset = AppStorage.Get('moveOffset');
      AppStorage.SetOrCreate('overlayPositionX', moveAppX - moveOffset[0]);
      AppStorage.SetOrCreate('overlayPositionY', moveAppY - moveOffset[1]);
    } else {
      AppStorage.SetOrCreate('overlayPositionX', moveAppX - (this.styleConfig.mIconSize/2));
      AppStorage.SetOrCreate('overlayPositionY', moveAppY - (this.styleConfig.mIconSize/2));
    }

  }

  protected onDragDrop(event: any, insertIndex: number, itemIndex: number): boolean {
    super.onDragDrop(event, insertIndex, itemIndex);
    console.info('Launcher PageDesktop onDragDrop insertIndex: ' + insertIndex + ' ,mIsInEffectArea: ' + this.mIsInEffectArea);
    AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_HIDE);
    let isDragSuccess = false;
    if (this.mIsInEffectArea) {
      const moveAppX = event.touches[0].screenX;
      const moveAppY = event.touches[0].screenY;
      this.mEndPosition = this.getTouchPosition(moveAppX, moveAppY);
      const dragItemInfo = this.getDragItemInfo();
      if (dragItemInfo.type == CommonConstants.TYPE_FOLDER || dragItemInfo.type == CommonConstants.TYPE_CARD ) {
        const positionOffset = AppStorage.Get('positionOffset');

        this.mEndPosition.row = this.mEndPosition.row - positionOffset[1];
        this.mEndPosition.column = this.mEndPosition.column - positionOffset[0];
        this.mGridConfig = this.mPageDesktopViewModel.getGridConfig();
        if (this.mEndPosition.row < 0) {
          this.mEndPosition.row = 0;
        } else if (this.mEndPosition.row + dragItemInfo.area[1] > this.mGridConfig.row) {
          this.mEndPosition.row = this.mGridConfig.row - dragItemInfo.area[1];
        }
        if (this.mEndPosition.column < 0) {
          this.mEndPosition.column = 0;
        } else if (this.mEndPosition.column + dragItemInfo.area[0] > this.mGridConfig.column ) {
          this.mEndPosition.column = this.mGridConfig.column - dragItemInfo.area[0];
        }

        AppStorage.SetOrCreate('positionOffset', []);
        AppStorage.SetOrCreate('moveOffset', []);

      } else if(dragItemInfo.type === CommonConstants.TYPE_APP) {
        if (this.mEndPosition.page == dragItemInfo.page &&
        this.mEndPosition.row == dragItemInfo.row &&
        this.mEndPosition.column == dragItemInfo.column) {
          isDragSuccess = true;
          return isDragSuccess;
        }

        const info = this.mPageDesktopViewModel.getLayoutInfo();
        const layoutInfo = info.layoutInfo;
        const endLayoutInfo = layoutInfo.find(item => {
          if (item.type == CommonConstants.TYPE_FOLDER || item.type == CommonConstants.TYPE_CARD) {
            return item.page === this.mEndPosition.page && this.isItemInRowColumn(this.mEndPosition.row, this.mEndPosition.column, item);
          } else if (item.type == CommonConstants.TYPE_APP) {
            return item.page === this.mEndPosition.page && item.row === this.mEndPosition.row && item.column === this.mEndPosition.column;
          }
        });

        if (endLayoutInfo != undefined) {
          if (endLayoutInfo.type === CommonConstants.TYPE_FOLDER) {
            const appInfo = {
              appName: '',
              bundleName: dragItemInfo.bundleName,
              type: dragItemInfo.type,
              area: dragItemInfo.area,
              page: dragItemInfo.page,
              column: dragItemInfo.column,
              row: dragItemInfo.row,
              isSystemApp: '',
              isUninstallAble: '',
              appIconId: '',
              appLabelId: '',
              abilityName: '',
              x: '',
              badgeNumber: dragItemInfo.badgeNumber
            };

            // add app to folder
            this.mFolderViewModel.addOneAppToFolder(appInfo, endLayoutInfo.folderId);

            isDragSuccess = true;
            return isDragSuccess;

          } else if (endLayoutInfo.type === CommonConstants.TYPE_APP) {
            // create a new folder
            const appListInfo = [];
            if (endLayoutInfo != undefined) {
              appListInfo.push(endLayoutInfo);
            }
            const startLayoutInfo = layoutInfo.find(item => {
              return item.page === dragItemInfo.page && item.row === dragItemInfo.row && item.column === dragItemInfo.column;
            });
            if (startLayoutInfo != undefined) {
              appListInfo.push(startLayoutInfo);
            }
            // add apps to new folder
            this.mFolderViewModel.addNewFolder(appListInfo);

            isDragSuccess = true;
            return isDragSuccess;
          }
        }
      }
      if (this.isSelfDrag()) {
        const info = this.mPageDesktopViewModel.getLayoutInfo();
        const layoutInfo = info.layoutInfo;
        this.checkAndMove(this.mStartPosition, this.mEndPosition, layoutInfo, dragItemInfo);
        info.layoutInfo = layoutInfo;
        this.mPageDesktopViewModel.setLayoutInfo(info);
        this.mPageDesktopViewModel.pagingFiltering();

        isDragSuccess = true;
      } else {
        this.addItemToDeskTop(dragItemInfo, this.mEndPosition);
      }
    }
    return isDragSuccess;
  }

  protected onDragEnd(isSuccess: boolean): void {
    super.onDragEnd(isSuccess);
    console.info('Launcher PageDesktop onDragEnd isSuccess: ' + isSuccess);
    if (this.isDropOutSide() && isSuccess) {
      console.info('Launcher PageDesktop onDragEnd remove item');
      this.removeItemFromDeskTop(this.mStartPosition);
    }
    this.mPageDesktopViewModel.deleteBlankPageByPageNo(this.mStartPosition.page);
    this.mStartPosition = null;
    this.mEndPosition = null;
    AppStorage.SetOrCreate('dragFocus', '');
  }

  private layoutAdjustment(startInfo, endInfo) {
    const info = this.mPageDesktopViewModel.getLayoutInfo();
    const layoutInfo = info.layoutInfo;
    this.moveLayout(startInfo, endInfo, layoutInfo, startInfo);
    info.layoutInfo = layoutInfo;
    console.info('Launcher PageDesktop layoutAdjustment setLayoutInfo');
    this.mPageDesktopViewModel.setLayoutInfo(info);
    this.mPageDesktopViewModel.pagingFiltering();
  }

  private addItemToDeskTop(itemInfo, endInfo) {
    const info = this.mPageDesktopViewModel.getLayoutInfo();
    const layoutInfo = info.layoutInfo;
    if (!this.isValidShortcut(layoutInfo, itemInfo)) {
      console.info('Launcher PageDesktop layoutAdjustment isInvalidShortcut');
      return;
    }
    const moveItem = {
      bundleName: itemInfo.bundleName,
      type: CommonConstants.TYPE_APP,
      page: -1,
      row: -1,
      column: -1
    };
    layoutInfo.push(moveItem);
    this.moveLayout(moveItem, endInfo, layoutInfo, moveItem);
    for (let i = layoutInfo.length - 1; i >= 0; i--) {
      if (layoutInfo[i].page == -1 && layoutInfo[i].column == -1 && layoutInfo[i].row == -1) {
        layoutInfo.splice(i, 1);
        break;
      }
    }
    info.layoutInfo = layoutInfo;
    console.info('Launcher PageDesktop addItemToDeskTop setLayoutInfo');
    this.mPageDesktopViewModel.setLayoutInfo(info);
    this.mPageDesktopViewModel.pagingFiltering();
  }

  private isValidShortcut(layoutInfo, itemInfo): boolean {
    for (let i = 0; i < layoutInfo.length; i++) {
      if (layoutInfo[i].bundleName === itemInfo.bundleName) {
        return false;
      }
    }
    return itemInfo != [] && itemInfo != undefined && itemInfo != null;
  }

  removeItemFromDeskTop(startInfo) {
    const info = this.mPageDesktopViewModel.getLayoutInfo();
    const layoutInfo = info.layoutInfo;
    for (let i = layoutInfo.length - 1; i >= 0; i--) {
      if (layoutInfo[i].page == startInfo.page && layoutInfo[i].row == startInfo.row && layoutInfo[i].column == startInfo.column) {
        layoutInfo.splice(i, 1);
      }
    }
    info.layoutInfo = layoutInfo;
    console.info('Launcher PageDesktop removeItemFromDeskTop setLayoutInfo');
    this.mPageDesktopViewModel.setLayoutInfo(info);
    this.mPageDesktopViewModel.pagingFiltering();
  }

  private moveLayout(source, destination, layoutInfo, startInfo) {
    const couldMoveForward = this.moveLayoutForward(source, destination, layoutInfo, startInfo);
    if (couldMoveForward) return;
    this.moveLayoutBackward(source, destination, layoutInfo, startInfo);
  }

  private moveLayoutForward(source, destination, layoutInfo, startInfo) {
    this.mGridConfig = this.mPageDesktopViewModel.getGridConfig();
    const startLayoutInfo = layoutInfo.find(item => {
      return item.page == source.page && item.row == source.row && item.column == source.column;
    });
    const endLayoutInfo = layoutInfo.find(item => {
      return item.page == destination.page && item.row == destination.row && item.column == destination.column;
    });

    if (endLayoutInfo != undefined
      && !(endLayoutInfo.page == startInfo.page && endLayoutInfo.row == startInfo.row && endLayoutInfo.column == startInfo.column)) {
      if (endLayoutInfo.row == this.mGridConfig.row - 1 && endLayoutInfo.column == this.mGridConfig.column - 1) {
        return false;
      }
      const nextPosition = {
        page: destination.page,
        row: destination.column == this.mGridConfig.column - 1 ? destination.row + 1 : destination.row,
        column: destination.column == this.mGridConfig.column - 1 ? 0 : destination.column + 1
      };
      const couldMoveForward = this.moveLayoutForward(destination, nextPosition, layoutInfo, startInfo);
      if (!couldMoveForward) return false;
    }
    startLayoutInfo.page = destination.page;
    startLayoutInfo.row = destination.row;
    startLayoutInfo.column = destination.column;
    return true;
  }

  private moveLayoutBackward(source, destination, layoutInfo, startInfo) {
    this.mGridConfig = this.mPageDesktopViewModel.getGridConfig();
    const startLayoutInfo = layoutInfo.find(item => {
      return item.page == source.page && item.row == source.row && item.column == source.column;
    });
    const endLayoutInfo = layoutInfo.find(item => {
      return item.page == destination.page && item.row == destination.row && item.column == destination.column;
    });

    if (endLayoutInfo != undefined &&
      !(endLayoutInfo.page == startInfo.page && endLayoutInfo.row == startInfo.row && endLayoutInfo.column == startInfo.column)) {
      if (endLayoutInfo.row == 0 && endLayoutInfo.column == 0) {
        return false;
      }
      const nextPosition = {
        page: destination.page,
        row: (destination.column == 0 && destination.row > 0) ? destination.row - 1 : destination.row,
        column: destination.column == 0 ? this.mGridConfig.column - 1 : destination.column - 1
      };
      const couldMoveBackward = this.moveLayoutBackward(destination, nextPosition, layoutInfo, startInfo);
      if (!couldMoveBackward) return false;
    }
    startLayoutInfo.page = destination.page;
    startLayoutInfo.row = destination.row;
    startLayoutInfo.column = destination.column;
    return true;
  }

  /**
   * folder squeeze handle
   * @param source
   * @param destination
   * @param layoutInfo
   * @param dragItemInfo
   */
  private checkAndMove(source, destination, layoutInfo, dragItemInfo) {
    Log.showInfo(TAG, 'checkAndMove start');

    const allPositions = this.getAllPositions(destination, layoutInfo);

    const objectPositionCount = this.getObjectPositionCount(destination, layoutInfo);

    const pressedPositions = this.getPressedObjects(destination, allPositions, dragItemInfo);

    // source and destination is in the same page
    if (source.page == destination.page && !this.checkCanMoveInSamePage(pressedPositions, objectPositionCount, dragItemInfo)) {
      return false;
    }
    // source and destination is in diff page
    if (source.page != destination.page && !this.checkCanMoveInDiffPage(allPositions, dragItemInfo)) {
      return false;
    }

    if (source.page == destination.page) {
      this.setSourcePositionToNull(dragItemInfo, allPositions);
    }
    this.setDestinationPosition(destination, allPositions, dragItemInfo);

    Log.showInfo(TAG, `checkAndMove pressedPositions.foldersAndForms: ${pressedPositions.foldersAndForms.length}`);
    if (pressedPositions.foldersAndForms.length != 0) {
      if (!this.moveFoldersAndForms(pressedPositions.foldersAndForms, destination, allPositions, dragItemInfo)) {
        return false;
      }
    }

    Log.showInfo(TAG, `checkAndMove pressedPositions.apps.length: ${pressedPositions.apps.length}`);
    if (pressedPositions.apps.length != 0) {
      this.moveApps(pressedPositions.apps, allPositions);
    }

    Log.showInfo(TAG, 'checkAndMove update destination ');
    let bundleName = '';
    if (dragItemInfo.type == CommonConstants.TYPE_FOLDER) {
      bundleName = dragItemInfo.folderId;
    } else if (dragItemInfo.type == CommonConstants.TYPE_CARD) {
      bundleName = dragItemInfo.cardId;
    } else if (dragItemInfo.type == CommonConstants.TYPE_APP) {
      bundleName = dragItemInfo.bundleName;
    }

    for (let j = 0; j < dragItemInfo.area[1]; j++) {
      for (let i = 0; i < dragItemInfo.area[0]; i++) {
        const destinationPosition = {
          type: dragItemInfo.type,
          bundleName: bundleName
        };
        allPositions[destination.row + j][destination.column + i] = destinationPosition;
      }
    }

    Log.showInfo(TAG, 'checkAndMove update layoutInfo ');
    for (let index = 0; index < layoutInfo.length; index++) {
      for (let row = allPositions.length - 1; row >= 0 ; row--) {
        for (let column = allPositions[row].length - 1; column >= 0 ; column--) {
          if (layoutInfo[index].type == CommonConstants.TYPE_APP && layoutInfo[index].bundleName == allPositions[row][column].bundleName ||
          layoutInfo[index].type == CommonConstants.TYPE_FOLDER && layoutInfo[index].folderId == allPositions[row][column].bundleName ||
          layoutInfo[index].type == CommonConstants.TYPE_CARD && layoutInfo[index].cardId == allPositions[row][column].bundleName) {
            layoutInfo[index].row = row;
            layoutInfo[index].column = column;
            layoutInfo[index].page = destination.page;
          }
        }
      }
    }
    Log.showInfo(TAG, 'checkAndMove end');
    return true;
  }

  /**
   * get desktop's position info
   * @param destination
   * @param layoutInfo
   */
  private getAllPositions(destination, layoutInfo) {
    Log.showInfo(TAG, 'getAllPositions start');
    const mGridConfig = this.mPageDesktopViewModel.getGridConfig();
    const pageRow = mGridConfig.row;
    const pageColumn = mGridConfig.column;
    const allPositions = [];

    // set null to all positions in current page
    for (let row = 0; row < pageRow; row++) {
      const rowPositions = [];
      for (let column = 0; column < pageColumn; column++) {
        const position = {
          type: -1,
          bundleName: 'null',
          area: []
        };
        rowPositions.push(position);
      }
      allPositions.push(rowPositions);
    }

    // set position in layoutInfo to all positions
    for (let i = 0; i < layoutInfo.length; i++) {
      if (layoutInfo[i].page == destination.page) {
        if (layoutInfo[i].type == CommonConstants.TYPE_FOLDER || layoutInfo[i].type == CommonConstants.TYPE_CARD) {
          let bundleName = '';
          if (layoutInfo[i].type == CommonConstants.TYPE_FOLDER) {
            bundleName = layoutInfo[i].folderId;
          } else if (layoutInfo[i].type == CommonConstants.TYPE_CARD) {
            bundleName = layoutInfo[i].cardId;
          }

          const positionInLayoutInfo = {
            type: layoutInfo[i].type,
            bundleName: bundleName,
            area: layoutInfo[i].area
          };
          for (let k = 0; k < layoutInfo[i].area[1]; k++) {
            for (let j = 0; j < layoutInfo[i].area[0]; j++) {
              allPositions[layoutInfo[i].row + k][layoutInfo[i].column + j] = positionInLayoutInfo;
            }
          }
        } else if (layoutInfo[i].type == CommonConstants.TYPE_APP) {
          const positionInLayoutInfo = {
            type: layoutInfo[i].type,
            bundleName: layoutInfo[i].bundleName,
            area: layoutInfo[i].area
          };
          allPositions[layoutInfo[i].row][layoutInfo[i].column] = positionInLayoutInfo;
        }
      }
    }
    Log.showInfo(TAG, 'getAllPositions end');
    return allPositions;
  }

  /**
   * get desktop's position count by Object
   * @param destination
   * @param layoutInfo
   */
  private getObjectPositionCount(destination, layoutInfo): Map<string, number> {
    Log.showInfo(TAG, 'getObjectPositionCount start');

    const objectPositionCount = new Map<string, number>();
    // set position in layoutInfo to all positions
    for (let i = 0; i < layoutInfo.length; i++) {
      if (layoutInfo[i].page == destination.page) {
        const count = layoutInfo[i].area[0] * layoutInfo[i].area[1];
        let bundleName = '';
        if (layoutInfo[i].type == CommonConstants.TYPE_FOLDER) {
          bundleName = layoutInfo[i].folderId;
        } else if (layoutInfo[i].type == CommonConstants.TYPE_CARD) {
          bundleName = layoutInfo[i].cardId;
        } else if (layoutInfo[i].type == CommonConstants.TYPE_APP) {
          bundleName = layoutInfo[i].bundleName;
        }
        objectPositionCount.set(bundleName, count);
      }
    }
    Log.showInfo(TAG, 'getObjectPositionCount end');
    return objectPositionCount;
  }

  /**
   * get Object under pressed big folder or form
   * @param destination
   * @param allPositions
   * @param dragItemInfo
   */
  private getPressedObjects(destination, allPositions, dragItemInfo) {
    Log.showInfo(TAG, 'getPressedObjects start');
    const row = destination.row;
    const column = destination.column;
    const apps = [];
    const foldersAndForms = [];

    Log.showInfo(TAG, `getPressedObjects destination.row: ${row},destination.column:${column}`);

    for (let j = 0; j < dragItemInfo.area[1]; j++) {
      for (let i = 0; i < dragItemInfo.area[0]; i++) {
        if (allPositions[row + j][column + i].type == CommonConstants.TYPE_APP) {
          apps.push(allPositions[row + j][column + i]);
        } else if (allPositions[row + j][column + i].type == CommonConstants.TYPE_FOLDER &&
        allPositions[row + j][column + i].bundleName != dragItemInfo.folderId) {
          foldersAndForms.push(allPositions[row + j][column + i]);
        } else if (allPositions[row + j][column + i].type == CommonConstants.TYPE_CARD &&
        allPositions[row + j][column + i].bundleName != dragItemInfo.cardId) {
          foldersAndForms.push(allPositions[row + j][column + i]);
        }
      }
    }

    Log.showInfo(TAG, `getPressedObjects foldersAndForms.length: ${foldersAndForms.length}`);
    Log.showInfo(TAG, `getPressedObjects apps.length: ${apps.length}`);
    const pressedObjects = {
      apps,
      foldersAndForms
    };
    Log.showInfo(TAG, 'getPressedObjects end');
    return pressedObjects;
  }

  /**
   * check of canMove in same page
   * @param pressedPositions
   * @param objectPositionCount
   * @param dragItemInfo
   */
  private checkCanMoveInSamePage(pressedPositions, objectPositionCount, dragItemInfo) {
    Log.showInfo(TAG, 'checkCanMoveInSamePage start');
    const foldersAndForms = pressedPositions.foldersAndForms;
    if (foldersAndForms.length == 0) {
      Log.showInfo(TAG, 'checkCanMoveInSamePage return true');
      return true;
    }

    if (foldersAndForms.length == 1) {
      if (dragItemInfo.type == CommonConstants.TYPE_APP && foldersAndForms[0].type == CommonConstants.TYPE_CARD) {
        return true;
      }
    }

    const coverPositionCount = new Map<string, number>();
    Log.showInfo(TAG, `checkCanMoveInSamePage foldersAndForms.length: ${foldersAndForms.length}`);
    for (let i = 0; i < foldersAndForms.length; i++) {
      const bundleName = foldersAndForms[i].bundleName;
      if (coverPositionCount.has(bundleName)) {
        coverPositionCount.set(bundleName, coverPositionCount.get(bundleName) + 1);
      } else {
        coverPositionCount.set(bundleName, 1);
      }
    }

    for (const bundleName of coverPositionCount.keys()) {
      if (coverPositionCount.get(bundleName) < objectPositionCount.get(bundleName) / 2) {
        Log.showInfo(TAG, 'checkCanMoveInSamePage end false');
        return false;
      }
    }
    Log.showInfo(TAG, 'checkCanMoveInSamePage end true');
    return true;
  }

  /**
   * check of canMove in diff page
   * @param allPositions
   */
  private checkCanMoveInDiffPage(allPositions, dragItemInfo) {
    Log.showInfo(TAG, 'checkCanMoveInDiffPage start');
    let count = 0;
    for (let i = 0; i < allPositions.length; i++) {
      for (let j = 0; j < allPositions[i].length; j++) {
        if (allPositions[i][j].type == -1) {
          count++;
        }
      }
    }
    const minCount = dragItemInfo.area[0] * dragItemInfo.area[1];
    // target page empty position min is dragItemInfo's need position
    if (count < minCount) {
      Log.showInfo(TAG, 'checkCanMoveInDiffPage end false');
      return false;
    }
    Log.showInfo(TAG, 'checkCanMoveInDiffPage end true');
    return true;
  }

  /**
   * set source‘s position to null
   * @param source
   * @param allPositions
   */
  private setSourcePositionToNull(dragItemInfo, allPositions) {
    Log.showInfo(TAG, 'setSourcePositionToNull start');
    for (let j = 0; j < dragItemInfo.area[1]; j++) {
      for (let i = 0; i < dragItemInfo.area[0]; i++) {
        const nullPosition = {
          type: -1,
          bundleName: 'null',
          area: []
        };
        allPositions[dragItemInfo.row + j][dragItemInfo.column + i] = nullPosition;
      }
    }

    Log.showInfo(TAG, 'setSourcePositionToNull end');
  }

  /**
   * set direction‘s position to null
   * @param destination
   * @param allPositions
   * @param dragItemInfo
   */
  private setDestinationPosition(destination, allPositions, dragItemInfo) {
    Log.showInfo(TAG, 'setDestinationPosition start');
    let bundleName = '';
    if (dragItemInfo.type == CommonConstants.TYPE_FOLDER) {
      bundleName = dragItemInfo.folderId;
    } else if (dragItemInfo.type == CommonConstants.TYPE_CARD) {
      bundleName = dragItemInfo.cardId;
    } else if (dragItemInfo.type == CommonConstants.TYPE_APP) {
      bundleName = dragItemInfo.bundleName;
    }

    for (let j = 0; j < dragItemInfo.area[1]; j++) {
      for (let i = 0; i < dragItemInfo.area[0]; i++) {
        if (allPositions[destination.row + j][destination.column+ i].type == -1) {
          const destinationPosition = {
            type: dragItemInfo.type,
            bundleName: bundleName,
            area: dragItemInfo.area
          };
          allPositions[destination.row + j][destination.column+ i] = destinationPosition;
        }
      }
    }
    Log.showInfo(TAG, 'setDestinationPosition end');
  }

  /**
   * move folders and forms to target position
   * @param foldersAndForms
   * @param destination
   * @param allPositions
   * @param dragItemInfo
   */
  private moveFoldersAndForms(foldersAndForms, destination, allPositions, dragItemInfo) {
    Log.showInfo(TAG, 'moveFoldersAndForms start');
    const movedFoldersAndForms = [];
    for (let i = 0; i < foldersAndForms.length; i++) {
      const moveFolderOrForm = foldersAndForms[i];
      if (movedFoldersAndForms.indexOf(moveFolderOrForm.bundleName) != -1) {
        continue;
      }

      for (let row = 0; row < allPositions.length; row++) {
        for (let column = 0; column < allPositions[row].length; column++) {
          if (moveFolderOrForm.bundleName == allPositions[row][column].bundleName) {
            let destinationFlag = false;
            for (let j = 0; j < dragItemInfo.area[1]; j++) {
              if (destinationFlag) {
                break;
              }
              for (let i = 0; i < dragItemInfo.area[0]; i++) {
                if (destination.row + j == row && destination.column + i == column) {
                  destinationFlag = true;
                  break;
                }
              }
            }
            if (!destinationFlag) {
              const nullPosition = {
                type: -1,
                bundleName: 'null',
                area: []
              };
              allPositions[row][column] = nullPosition;
            }
          }
        }
      }

      let isUsablePosition = false;
      for (let row = 0; row < allPositions.length; row++) {
        if (isUsablePosition) {
          break;
        }
        for (let column = 0; column < allPositions[row].length; column++) {
          let usedPosition = 0;
          for (let j = 0; j < moveFolderOrForm.area[1]; j++) {
            for (let i = 0; i < moveFolderOrForm.area[0]; i++) {
              if (row + j < allPositions.length && column + i < allPositions[row].length && allPositions[row + j][column + i].type == -1) {
                usedPosition++;
              }
            }
          }

          if (usedPosition == moveFolderOrForm.area[1] * moveFolderOrForm.area[0]) {
            isUsablePosition = true;
            for (let j = 0; j < moveFolderOrForm.area[1]; j++) {
              for (let i = 0; i < moveFolderOrForm.area[0]; i++) {
                const movePosition = {
                  type: moveFolderOrForm.type,
                  bundleName: moveFolderOrForm.bundleName,
                  area: moveFolderOrForm.area
                };
                allPositions[row + j][column + i] = movePosition;
              }
            }
            movedFoldersAndForms.push(moveFolderOrForm.bundleName);
            break;
          }
        }
      }
      if (!isUsablePosition) {
        Log.showInfo(TAG, 'moveFoldersAndForms return false');
        return false;
      }
    }

    let bundleName = '';
    if (dragItemInfo.type == CommonConstants.TYPE_FOLDER) {
      bundleName = dragItemInfo.folderId;
    } else if (dragItemInfo.type == CommonConstants.TYPE_CARD) {
      bundleName = dragItemInfo.cardId;
    } else if (dragItemInfo.type == CommonConstants.TYPE_APP) {
      bundleName = dragItemInfo.bundleName;
    }

    for (let j = 0; j < dragItemInfo.area[1]; j++) {
      for (let i = 0; i < dragItemInfo.area[0]; i++) {
        const dragItemPosition = {
          type: dragItemInfo.type,
          bundleName: bundleName,
          area: dragItemInfo.area
        };
        allPositions[destination.row + j][destination.column + i] = dragItemPosition;
      }
    }

    Log.showInfo(TAG, 'moveFoldersAndForms end');
    return true;
  }

  /**
   * move apps to target position
   * @param apps
   * @param allPositions
   */
  private moveApps(apps, allPositions) {
    Log.showInfo(TAG, 'moveApps start');
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      let isUsable = false;
      for (let row = 0; row < allPositions.length; row++) {
        if (isUsable) {
          break;
        }
        for (let column = 0; column < allPositions[row].length; column++) {
          if (allPositions[row][column].type == -1) {
            const appPosition = {
              type: app.type,
              bundleName: app.bundleName,
              area: app.area
            };
            allPositions[row][column] = appPosition;
            isUsable = true;
            break;
          }
        }
      }
    }
    Log.showInfo(TAG, 'moveApps end');
  }
}
