/*Copyright 2019 Kirk McDonald

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
import { spec } from "./factory.js"
import { Rational, zero, one } from "./rational.js"

const SELECTED_INPUT = "selected"

// events

function itemHandler(target) {
    return function() {
        let itemKey = this.value
        target.itemKey = itemKey
        target.item = spec.items.get(itemKey)
        target.dropdown.classList.remove("open")
        spec.updateSolution()
    }
}

function removeHandler(target) {
    return function() {
        spec.removeTarget(target)
        spec.updateSolution()
    }
}

function changeBuildingCountHandler(target) {
    return function() {
        target.buildingsChanged()
        spec.updateSolution()
    }
}

function changeRateHandler(target) {
    return function() {
        target.rateChanged()
        spec.updateSolution()
    }
}

let targetCount = 0

function toggleDropdown() {
    let classes = this.parentNode.classList
    if (classes.contains("open")) {
        classes.remove("open")
    } else {
        classes.add("open")
    }
}

export class BuildTarget {
    constructor(index, itemKey, item, tiers) {
        this.index = index
        this.itemKey = itemKey
        this.item = item
        this.changedBuilding = true
        this.buildings = one
        this.rate = zero

        let element = d3.create("li")
            .classed("target", true)
        element.append("button")
            .classed("targetButton ui", true)
            .text("x")
            .attr("title", "Remove this item.")
            .on("click", removeHandler(this))
        this.element = element.node()

        let dropdown = element.append("span")
            .classed("dropdownWrapper", true)
        this.dropdown = dropdown.node()
        dropdown.append("div")
            .classed("clicker", true)
            .on("click", toggleDropdown)
        let tierDiv = dropdown.append("div")
            .classed("dropdown itemDropdown", true)
            .selectAll("div")
            .data(tiers)
            .join("div")
        let itemSpan = tierDiv.selectAll("span")
            .data(d => d)
            .join("span")
        itemSpan.append("input")
            .on("change", itemHandler(this))
            .attr("id", d => `target-${targetCount}-${d.key}`)
            .attr("name", `target-${targetCount}`)
            .attr("type", "radio")
            .attr("value", d => d.key)
            .attr("checked", d => d === item ? "" : null)
        itemSpan.append("label")
            .attr("for", d => `target-${targetCount}-${d.key}`)
            .append("img")
                .classed("icon", true)
                .attr("src", d => "images/" + d.name + ".png")
                //.attr("width", 32)
                //.attr("height", 32)
                .attr("title", d => d.name)
        dropdown.append("div")
            .classed("spacer", true)

        targetCount++

        this.buildingLabel = element.append("label")
            .classed(SELECTED_INPUT, true)
            .text(" Buildings: ")
            .node()

        this.buildingInput = element.append("input")
            .on("change", changeBuildingCountHandler(this))
            .attr("type", "text")
            .attr("value", 1)
            .attr("size", 3)
            .attr("title", "Enter a value to specify the number of buildings. The rate will be determined based on the number of items a single building can make.")
            .node()

        this.rateLabel = element.append("label")
            .node()
        this.setRateLabel()

        this.rateInput = element.append("input")
            .on("change", changeRateHandler(this))
            .attr("type", "text")
            .attr("value", "")
            .attr("size", 5)
            .attr("title", "Enter a value to specify the rate. The number of buildings will be determined based on the rate.")
            .node()
    }
    setRateLabel() {
        this.rateLabel.textContent = " Items/" + spec.format.longRate + ": "
    }
    getRate() {
        this.setRateLabel()
        let rate = zero
        let recipe = spec.getRecipe(this.item)
        if (recipe.category === null && this.changedBuilding) {
            this.rateChanged()
        }
        let baseRate = spec.getRecipeRate(recipe)
        if (baseRate !== null) {
            baseRate = baseRate.mul(recipe.gives(this.item))
        }
        if (this.changedBuilding) {
            rate = baseRate.mul(this.buildings)
            this.rateInput.value = spec.format.rate(rate)
        } else {
            rate = this.rate
            if (baseRate !== null) {
                let count = rate.div(baseRate)
                this.buildingInput.value = spec.format.count(count)
            } else {
                this.buildingInput.value = "N/A"
            }
            this.rateInput.value = spec.format.rate(rate)
        }
        return rate
    }
    buildingsChanged() {
        this.changedBuilding = true
        this.buildingLabel.classList.add(SELECTED_INPUT)
        this.rateLabel.classList.remove(SELECTED_INPUT)
        this.buildings = Rational.from_string(this.buildingInput.value)
        this.rate = zero
        this.rateInput.value = ""
    }
    setBuildings(count) {
        this.buildingInput.value = count
        this.buildingsChanged()
    }
    rateChanged() {
        this.changedBuilding = false
        this.buildingLabel.classList.remove(SELECTED_INPUT)
        this.rateLabel.classList.add(SELECTED_INPUT)
        this.buildings = zero
        this.rate = Rational.from_string(this.rateInput.value).div(spec.format.rateFactor)
        this.buildingInput.value = ""
    }
    setRate(rate) {
        this.rateInput.value = rate
        this.rateChanged()
    }
}
