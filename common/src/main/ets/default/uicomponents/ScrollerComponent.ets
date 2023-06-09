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

import amsMissionManager from '../manager/AmsMissionManager.ts'
import StyleConstants from '../constants/StyleConstants';

@Component
export default struct ScrollerComponent {
  @StorageLink('snapshotList') dataList: {
    name: any,
    image: any,
    missionId: number,
    boxSize: number,
    bundleName: string,
    left?: number,
    right?: number,
  }[] = [];
  @StorageLink('snapShotWidth') listWidth: number = 0;
  scroller: Scroller= new Scroller() ;
  private screenWidth = 800;
  popupHide: Function= null;
  updateData: Function= null;

  build() {
    Column() {
      Stack({ alignContent: Alignment.Center }) {
        Scroll(this.scroller) {
          Row() {
            ForEach(this.dataList, (item) => {
              Column() {
                Flex({
                  direction: FlexDirection.Row,
                  alignItems: ItemAlign.Center,
                  justifyContent: FlexAlign.SpaceBetween
                }) {
                  Text(item.name.toString())
                    .height(StyleConstants.DEFAULT_24)
                    .textOverflow({ overflow: TextOverflow.Ellipsis })
                    .fontSize(StyleConstants.DEFAULT_14)
                    .textAlign(TextAlign.Start)
                    .maxLines(StyleConstants.DEFAULT_1)
                    .width(item.boxSize - StyleConstants.DEFAULT_30)
                    .hoverEffect(HoverEffect.None)
                    .fontWeight(FontWeight.Medium)

                  Image($r('app.media.ic_public_cancel'))
                    .width(StyleConstants.DEFAULT_16)
                    .height(StyleConstants.DEFAULT_16)
                    .objectFit(ImageFit.Contain)
                    .margin({ right: StyleConstants.DEFAULT_4 })
                    .onClick((event: ClickEvent) => {
                      if (this.dataList.length <= 1) {
                        this.updateData(false, "", () => amsMissionManager.clearMission(item.missionId));
                        return
                      }
                      this.updateData(true, item.bundleName, () => amsMissionManager.clearMission(item.missionId));
                    })
                }
                .width(item.boxSize)

                Image(item.image)
                  .height(StyleConstants.DEFAULT_SMART_DOCK_MISSION_IMAGE_HEIGHT)
                  .objectFit(ImageFit.Contain)
                  .borderRadius(StyleConstants.DEFAULT_8)
                  .hoverEffect(HoverEffect.None)
              }
              .onClick((event: ClickEvent) => {
                this.popupHide()
                amsMissionManager.moveMissionToFront(item.missionId);
              })
              .width(item.boxSize)
              .margin({ right: StyleConstants.DEFAULT_14 })
              .borderRadius(StyleConstants.DEFAULT_5)
            }, item => JSON.stringify(item))
          }
        }
        .margin({
          left: this.listWidth > this.screenWidth ? StyleConstants.DEFAULT_56 : StyleConstants.DEFAULT_14,
          right: this.listWidth > this.screenWidth ? StyleConstants.DEFAULT_56 : StyleConstants.DEFAULT_0
        })
        .constraintSize({
          maxWidth: this.screenWidth,
          maxHeight: StyleConstants.DEFAULT_SMART_DOCK_MISSION_HEIGHT
        })
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .height(StyleConstants.DEFAULT_SMART_DOCK_MISSION_HEIGHT)

        Flex({
          direction: FlexDirection.Row,
          alignItems: ItemAlign.Center,
          justifyContent: FlexAlign.SpaceBetween
        }) {
          Flex({
            direction: FlexDirection.Row,
            alignItems: ItemAlign.Center,
            justifyContent: FlexAlign.Center
          }) {
            Button({ type: ButtonType.Circle, stateEffect: true }) {
              Image($r('app.media.ic_public_arrow_left'))
                .width(20)
                .height(20)
                .objectFit(ImageFit.Contain)
            }
            .width(24)
            .height(24)
            .backgroundColor('#00000005')
            .onClick((event: ClickEvent) => {
              this.onClickLeft();
            })
          }
          .width(StyleConstants.DEFAULT_56)
          .height(StyleConstants.DEFAULT_SMART_DOCK_MISSION_HEIGHT)

          Flex({
            direction: FlexDirection.Row,
            alignItems: ItemAlign.Center,
            justifyContent: FlexAlign.Center
          }) {
            Button({ type: ButtonType.Circle, stateEffect: true }) {
              Image($r('app.media.ic_public_arrow_right'))
                .width(20)
                .height(20)
                .objectFit(ImageFit.Contain)
            }
            .width(24)
            .height(24)
            .backgroundColor('#00000005')
            .onClick((event: ClickEvent) => {
              this.onClickLeft();
            })
          }
          .width(StyleConstants.DEFAULT_56)
          .height(StyleConstants.DEFAULT_SMART_DOCK_MISSION_HEIGHT)
        }
        .width(this.screenWidth + 2 * StyleConstants.DEFAULT_56)
        .height(StyleConstants.DEFAULT_SMART_DOCK_MISSION_HEIGHT)
        .visibility(this.listWidth > this.screenWidth ? Visibility.Visible : Visibility.None)
      }
    }
    .visibility(this.dataList.length < 1 ? Visibility.None : Visibility.Visible)
  }

  private onClickLeft() {
    let currentOffset = this.scroller.currentOffset().xOffset;
    let tmp = 0;
    for (let i = 0;i < this.dataList.length; i++) {
      if ((tmp = tmp + this.dataList[i].boxSize + this.dataList[i].left) >= currentOffset) {
        currentOffset = tmp - this.dataList[i].boxSize - this.dataList[i].left;
        break;
      }
    }

    this.scroller.scrollTo({
      yOffset: this.scroller.currentOffset().yOffset,
      xOffset: currentOffset
    })
  }

  private onClickRight() {
    let currentOffset = this.scroller.currentOffset().xOffset;
    let tmp = 0;

    for (let i = 0;i < this.dataList.length; i++) {
      if ((tmp = tmp + this.dataList[i].boxSize + this.dataList[i].left) > currentOffset + this.screenWidth) {
        currentOffset = tmp - (this.screenWidth) + this.dataList[i].left;
        break
      }
    }

    this.scroller.scrollTo({
      yOffset: this.scroller.currentOffset().yOffset,
      xOffset: currentOffset
    })
  }
}