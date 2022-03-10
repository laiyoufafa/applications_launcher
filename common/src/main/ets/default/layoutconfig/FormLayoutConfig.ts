/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
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

import CommonConstants from '../constants/CommonConstants';
import formLayoutInfo from '../configs/FormLayoutInfo';
import ILayoutConfig from './ILayoutConfig';

/**
 * Form layout configuration
 */
export default class FormLayoutConfig extends ILayoutConfig {

  /**
   *  The index of form layout configuration
   */
  static FORM_LAYOUT_INFO = 'FormLayoutInfo';
  protected mFormLayoutInfo: any = formLayoutInfo;

  protected constructor() {
    super();
  }

  /**
   * Get folder layout configuration instance
   */
  static getInstance() {
    if (globalThis.FormLayoutConfigInstance == null) {
      globalThis.FormLayoutConfigInstance = new FormLayoutConfig();
      globalThis.FormLayoutConfigInstance.initConfig();
    }
    return globalThis.FormLayoutConfigInstance;
  }

  initConfig(): void {
    const config = this.loadPersistConfig();
    this.mFormLayoutInfo = config;
  }

  getConfigLevel(): string {
    return CommonConstants.LAYOUT_CONFIG_LEVEL_COMMON;
  }

  getConfigType(): number {
    return CommonConstants.LAYOUT_CONFIG_TYPE_FUNCTION;
  }

  getConfigName(): string {
    return FormLayoutConfig.FORM_LAYOUT_INFO;
  }

  protected getPersistConfigJson(): string {
    return JSON.stringify(this.mFormLayoutInfo);
  }

  /**
   * Update form layout data
   *
   * @params {gridLayoutInfo} form layout data
   */
  updateFormLayoutInfo(formLayoutInfo): void {
    this.mFormLayoutInfo = formLayoutInfo;
    super.persistConfig();
  }

  /**
   * Get form layout data
   *
   * @return form layout data
   */
  getFormLayoutInfo(): any {
    return this.mFormLayoutInfo;
  }
}
