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

/**
 * An abstract class contains methods that can store layout data.
 */
export default class ILayoutConfig {
    constructor() {
    }

    /**
     * Get the layout view type.
     *
     * @return {string} Layout view type, should one of 'Grid' or 'List' which is stored in LayoutConstants class.
     */
    getAppPageStartConfig() {
        return this.loadAppPageStartConfig();
    }

    /**
     * Set the layout view type.
     *
     * @param {string} type - Layout view type, should one of 'Grid' or 'List' which is stored in LayoutConstants class.
     */
    setAppPageStartConfig(type) {
        this.saveAppPageStartConfig(type);
    }

    /**
     * Get grid layout config id.
     *
     * @return {number} grid layout config id.
     */
    getGridConfig() {
        return this.loadGridConfig();
    }

    /**
     * Set grid layout config id.
     *
     * @param {number} id - layout config id.
     */
    setGridConfig(id) {
        this.saveGridConfig(id);
    }

    /**
     * Get recent process max limit.
     *
     * @return {number} recent process max limit.
     */
    getRecentProcessLimit() {
        return this.loadRecentProcessLimit();
    }

    /**
     * Set recent process max limit.
     *
     * @param {number} num - Recent process max limit.
     */
    setRecentProcessLimit(num) {
        this.saveRecentProcessLimit(num);
    }

    /**
     * Get layout information of grid view.
     *
     * @return {object} layout information.
     */
    getGridLayoutInfo() {
        return this.loadGridLayoutInfo();
    }

    /**
     * Set layout information of grid view.
     */
    setGridLayoutInfo(layoutInfo) {
        this.saveGridLayoutInfo(layoutInfo);
    }

    /**
     * Remove layout information of grid view.
     */
    deleteGridLayoutInfo() {
        this.removeGridLayoutInfo();
    }

    /**
     * Should overridden by sub-classes , load the launcher layout view type.
     */
    loadAppPageStartConfig() {
    }

    /**
     * Should overridden by sub-classes , save the launcher layout view type.
     */
    saveAppPageStartConfig(type) {
    }

    /**
     * Should overridden by sub-classes , load the launcher grid view layout config id.
     */
    loadGridConfig() {
    }

    /**
     * Should overridden by sub-classes , save the launcher grid view layout config id.
     */
    saveGridConfig(id) {
    }

    /**
     * Should overridden by sub-classes , load the recent process max limit.
     */
    loadRecentProcessLimit() {
    }

    /**
     * Should overridden by sub-classes , save the recent process max limit.
     */
    saveRecentProcessLimit(num) {
    }

    /**
     * Should overridden by sub-classes , load the layout information of grid view.
     */
    loadGridLayoutInfo() {

    }

    /**
     * Should overridden by sub-classes , save the layout information of grid view.
     */
    saveGridLayoutInfo(layoutInfo) {

    }

    /**
     * Should overridden by sub-classes , remove layout information of grid view.
     */
    removeGridLayoutInfo() {

    }
}