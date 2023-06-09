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

import ResourceManager from '../manager/ResourceManager';
import Log from '../utils/Log';

const TAG = 'OverlayAppIcon';

@Component
export default struct OverlayAppIcon {
  @Prop iconSize: number;
  @Prop appIcon: string;
  @Prop bundleName: string;
  @Prop icon: string;

  // 0.9(pressed size) / 1.05(hover size) = 0.8571
  @State size: number = 0.8571;
  useCache: boolean = true;
  @Prop badgeNumber: number;
  @State badge: number = 0;
  private mResourceManager;
  private mDefaultAppIcon;

  public aboutToAppear(): void  {
    this.mResourceManager = ResourceManager.getInstance();
  }

  build() {
    Column() {
     Image(this.icon)
      .width(this.iconSize)
      .height(this.iconSize)
      .onComplete(() => {
        Log.showInfo(TAG, 'OverlayAppIcon complete');
        this.size = 1;
        AppStorage.SetOrCreate('isOverlayComplete', true);
       })
    }
    .width(this.iconSize)
    .height(this.iconSize)
    .scale({ x: this.size, y: this.size })
    .animation({ duration: 100 })
  }
}