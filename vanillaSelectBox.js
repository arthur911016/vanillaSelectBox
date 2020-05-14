/*
Copyright (C) Philippe Meyer 2019
Distributed under the MIT License
vanillaSelectBox : v0.30 : The menu stops moving around on window resize and scroll + z-index in order of creation for multiple instances
vanillaSelectBox : v0.26 : Corrected bug in stayOpen mode with disable() function
vanillaSelectBox : v0.25 : New option stayOpen, and the dropbox is no longer a dropbox but a nice multi-select
previous version : v0.24 : corrected bug affecting options with more than one class
https://github.com/PhilippeMarcMeyer/vanillaSelectBox
*/

let VSBoxCounter = function () {
    let count = 0;
    return {
        set: function () {
            return ++count;
        }
    };
}();

function vanillaSelectBox(domSelector, options) {
    let self = this;
    this.instanceOffset = VSBoxCounter.set();
    this.domSelector = domSelector;
    this.root = document.querySelector(domSelector)
    this.main;
    this.button;
    this.title;
    this.isMultiple = this.root.hasAttribute("multiple");
    this.multipleSize = this.isMultiple && this.root.hasAttribute("size") ? parseInt(this.root.getAttribute("size")) : -1;
    this.drop;
    this.top;
    this.left;
    this.options;
    this.listElements;
    this.isDisabled = false;
    this.search = false;
    this.isDropShown = false;
    this.searchZone = null;
    this.inputBox = null;
    this.ulminWidth = 140;
    this.ulminHeight = 25;
    this.userOptions = {
        maxWidth: 500,
        maxHeight: 400,
        translations: { "all": "All", "items": "items" },
        search: false,
        placeHolder: "",
        stayOpen:false,
        disableSelectAll: false,
        labelId: "",
    }
    if (options) {
        if (options.maxWidth != undefined) {
            this.userOptions.maxWidth = options.maxWidth;
        }
        if (options.maxHeight != undefined) {
            this.userOptions.maxHeight = options.maxHeight;
        }
        if (options.translations != undefined) {
            this.userOptions.translations = options.translations;
        }
        if (options.placeHolder != undefined) {
            this.userOptions.placeHolder = options.placeHolder;
        }
        if (options.search != undefined) {
            this.search = options.search;
        }
        if (options.stayOpen != undefined) {
            this.userOptions.stayOpen = options.stayOpen;
        }
        if (options.disableSelectAll != undefined) {
            this.userOptions.disableSelectAll = options.disableSelectAll;
        }
        if (options.labelId != undefined) {
            this.userOptions.labelId = options.labelId;
        }
    }
    this.repositionMenu = function(){
        let rect = self.main.getBoundingClientRect();
        this.drop.style.left = rect.left+"px";
        this.drop.style.top = rect.bottom+"px";
    }

    this.init = function () {
        let self = this;
        this.root.style.display = "none";
        let already = document.getElementById("btn-group-" + self.domSelector);
        if (already) {
            already.remove();
        }
        this.main = document.createElement("div");
        this.root.parentNode.insertBefore(this.main, this.root.nextSibling);
        this.main.classList.add("vsb-main");
        this.main.setAttribute("id", "btn-group-" + this.domSelector);
        this.main.style.marginLeft = this.main.style.marginLeft;
        if(self.userOptions.stayOpen){
            this.main.style.minHeight =  (this.userOptions.maxHeight+10) + "px";
        }

        let btnTag = self.userOptions.stayOpen ? "div" : "button";
        this.button = document.createElement(btnTag);
        this.button.setAttribute("role", "combobox");
        this.button.setAttribute("aria-controls", "list" + this.domSelector);
        this.button.setAttribute("aria-haspopup", "listbox");
        this.button.setAttribute("aria-expanded", "true");
        if (this.userOptions.labelId) {
            this.button.setAttribute("aria-labelledby", this.userOptions.labelId + " title" + this.domSelector );
        }

        let presentValue = this.main.value;
        this.main.appendChild(this.button);
        this.title = document.createElement("span");
        this.title.setAttribute("id", "title" + this.domSelector)
        this.button.appendChild(this.title);
        this.title.classList.add("title");
        let caret = document.createElement("span");
        this.button.appendChild(caret);
        caret.classList.add("caret");
        caret.style.position = "absolute";
        caret.style.right = "8px";
        caret.style.marginTop = "8px";
        if(self.userOptions.stayOpen){
            caret.style.display = "none";
            this.title.style.paddingLeft = "20px";
            this.title.style.fontStyle = "italic";
            this.title.style.verticalAlign = "20%";
        }
        let rect = this.button.getBoundingClientRect();
        this.top = rect.bottom;
        this.left = rect.left;
        this.drop = document.createElement("div");
        this.main.appendChild(this.drop);
        this.drop.classList.add("vsb-menu");
        this.drop.style.zIndex = 2000 - this.instanceOffset;
        this.ul = document.createElement("ul");
        this.ul.setAttribute("role", "listbox");
        this.ul.setAttribute("id", "list" + this.domSelector);
        this.ul.setAttribute("aria-expanded", "true");
        this.drop.appendChild(this.ul);

        if(!this.userOptions.stayOpen ){
            window.addEventListener("resize", function (e) {
                self.repositionMenu();
            });

            window.addEventListener("scroll", function (e) {
                self.repositionMenu();
            });
        }

        this.ul.style.maxHeight = this.userOptions.maxHeight + "px";
        this.ul.style.minWidth = this.ulminWidth + "px";
        this.ul.style.minHeight = this.ulminHeight + "px";
        if (this.isMultiple) {
            this.ul.classList.add("multi");
            if (!self.userOptions.disableSelectAll) {
                let selectAll = document.createElement("option");
                selectAll.setAttribute("value", 'all');
                selectAll.innerText = 'Select All';
                this.root.insertBefore(selectAll,(this.root.hasChildNodes())
                  ? this.root.childNodes[0]
                  : null);
            }
        }
        let selectedTexts = ""
        let sep = "";
        let nrActives = 0;

        if (this.search) {
            this.searchZone = document.createElement("div");
            this.ul.appendChild(this.searchZone);
            this.searchZone.classList.add("vsb-js-search-zone");
            this.searchZone.style.zIndex = 2001 - this.instanceOffset;
            this.inputBox = document.createElement("input");
            this.searchZone.appendChild(this.inputBox);
            this.inputBox.setAttribute("type", "text");
            this.inputBox.setAttribute("id", "search_" + this.domSelector);

            let fontSizeForP = this.isMultiple ? "8px" : "6px";
            var para = document.createElement("p");
            this.ul.appendChild(para);
            para.style.fontSize = fontSizeForP;
            para.innerHTML = "&nbsp;";
            this.ul.addEventListener("scroll", function (e) {
                var y = this.scrollTop;
                self.searchZone.parentNode.style.top = y + "px";
            });
        }
        this.options = document.querySelectorAll(this.domSelector + " option");
        let count = 1;
        Array.prototype.slice.call(this.options).forEach(function (x) {
            let text = x.textContent;
            let value = x.value;
            let classes = x.getAttribute("class");
            if(classes)
            {
                classes=classes.split(" ");
            }
            else
            {
                classes=[];
            }
            let li = document.createElement("li");
            li.setAttribute("role", "option");
            li.setAttribute("tabindex", "0");
            li.setAttribute("id", "option" + count++ + self.domSelector);
            let isSelected = x.hasAttribute("selected");
            self.ul.appendChild(li);
            li.setAttribute("data-value", value);
            li.setAttribute("data-text", text);
            li.setAttribute("aria-label", text);
            li.setAttribute("aria-selected", isSelected);
            if (classes.length != 0) {
                classes.forEach(function(x){
                    li.classList.add(x);
                });

            }
            if (isSelected) {
                nrActives++;
                selectedTexts += sep + text;
                sep = ",";
                li.classList.add("active");
                if (!self.isMultiple) {
                    self.title.textContent = text;
                    if (classes.length != 0) {
                        classes.forEach(function(x){
                            self.title.classList.add(x);
                        });
                    }
                }
            }
            li.appendChild(document.createTextNode(text));
        });
        if (self.multipleSize != -1) {
            if (nrActives > self.multipleSize) {
                let wordForItems = self.userOptions.translations.items || "items"
                selectedTexts = nrActives + " " + wordForItems;
            }
        }
        if (self.isMultiple) {
            self.title.innerHTML = selectedTexts;
            self.title.setAttribute("aria-label", selectedTexts);
        }
        if (self.userOptions.placeHolder != "" && self.title.textContent == "") {
            self.title.textContent = self.userOptions.placeHolder;
            self.title.setAttribute("aria-label", self.userOptions.placeHolder);
        }
        this.listElements = this.drop.querySelectorAll("li");
        if (self.search) {
            self.inputBox.addEventListener("keyup", function (e) {
                let searchValue = e.target.value.toUpperCase();
                let searchValueLength = searchValue.length;
                if (searchValueLength < 2) {
                    Array.prototype.slice.call(self.listElements).forEach(function (x) {
                        x.classList.remove("hidden-search");
                    });
                } else {
                    Array.prototype.slice.call(self.listElements).forEach(function (x) {
                        let text = x.getAttribute("data-text").toUpperCase();
                        if (text.indexOf(searchValue) == -1
                          && x.getAttribute('data-value') !== 'all'
                        ) {
                            x.classList.add("hidden-search");
                        } else {
                            x.classList.remove("hidden-search");
                        }
                    });
                }
            });
        }

        if(self.userOptions.stayOpen){
            self.drop.style.display = "block";
            self.drop.style.boxShadow = "none";
            self.drop.style.minHeight =  (this.userOptions.maxHeight+10) + "px";
            self.drop.style.position = "relative";
            self.drop.style.left = "0px";
            self.drop.style.top = "0px";
            self.button.style.border = "none";
        }else{
            self.button.addEventListener('keyup', function(e) {
                console.log(e);
                if (e.keyCode === 32 || e.keyCode === 13) {
                    if (self.isDisabled) return;
                    toggleDrop(e);
                }
                e.preventDefault();
                e.stopPropagation();
            });
            this.main.addEventListener("click", function (e) {
                // avoid wrong event trigger until we found a better solution
                if (e.screenX === 0) return;
                if (self.isDisabled) return;
                toggleDrop(e)
            });
        }
        this.drop.addEventListener("click", function (e) {
            if (self.isDisabled) return;
            if (!e.target.hasAttribute("data-value")) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            setValuesFromEvents(e);
        });
        this.drop.addEventListener("blur", function(e) {
            e.preventDefault();
            if (e.relatedTarget && e.relatedTarget.parentNode !== self.ul && self.isDropShown) {
                toggleDrop(e);
            }
            e.stopPropagation();
        }, true);
        this.drop.addEventListener("focusout", function(e) {
            e.preventDefault();
            if (e.relatedTarget && e.relatedTarget.parentNode !== self.ul && self.isDropShown) {
                toggleDrop(e);
            }
            e.stopPropagation();
        });
        this.drop.addEventListener("keyup", function(e) {
            if (self.isDisabled) return;

            if (!e.target.hasAttribute("data-value")) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if (e.keyCode === 13 || e.keyCode === 32) {
                e.preventDefault();
                setValuesFromEvents(e);
                e.stopPropagation();
            }

            if (e.keyCode === 40 || e.keyCode === 38) {
                e.preventDefault();
                changeFocusByArrowKeys(e);
                e.stopPropagation();
            }
        });

        this.drop.addEventListener("keyup", function(e) {
            if (e.keyCode === 27) {
                e.preventDefault();
                toggleDrop(e);
                e.stopPropagation();
            }
        });
        function docListener() {
            document.removeEventListener("click", docListener);
            self.drop.style.display = "none";
            if(self.search){
                self.inputBox.value = "";
                Array.prototype.slice.call(self.listElements).forEach(function (x) {
                    x.classList.remove("hidden-search");
                });
            }
        }
        function setValuesFromEvents(e) {
            let choiceValue = e.target.getAttribute("data-value");
            let choiceText = e.target.getAttribute("data-text");
            let className = e.target.getAttribute("class");

            if (choiceValue === 'all') {
                if (e.target.hasAttribute('data-selected')
                  && e.target.getAttribute('data-selected') === 'true') {
                    self.setValue([])
                    e.target.innerText = 'Select All'
                    e.target.setAttribute('data-selected', 'false')
                } else {
                    let allValues = []
                    e.target.innerText = 'Clear All'
                    Array.prototype.slice.call(self.listElements).forEach(function (x) {
                        if (x.hasAttribute('data-value')
                          && x.getAttribute('data-value') !== 'all'
                          && !x.classList.contains('hidden-search')) {
                            allValues.push(x.getAttribute('data-value'))
                        }
                    });
                    e.target.setAttribute('data-selected', 'true')
                    self.setValue(allValues)
                    e.target.classList.add("active");
                    e.target.setAttribute("aria-selected", "true");
                }
                return;
            }

            if (!self.isMultiple) {
                self.root.value = choiceValue;
                self.title.textContent = choiceText;
                self.title.setAttribute("aria-label", choiceText);
                if (className) {
                    self.title.setAttribute("class", className + " title");
                } else {
                    self.title.setAttribute("class", "title");
                }
                Array.prototype.slice.call(self.listElements).forEach(function (x) {
                    x.classList.remove("active");
                    x.setAttribute("aria-selected", "false");
                });
                if (choiceText != "") {
                    e.target.classList.add("active");
                    e.target.setAttribute("aria-selected", "true");
                }
                self.privateSendChange();
                if(!self.userOptions.stayOpen){
                    docListener();
                }
            } else {
                let wasActive = false;
                if (className) {
                    wasActive = className.indexOf("active") != -1;
                }
                if (wasActive) {
                    e.target.classList.remove("active");
                    e.target.setAttribute("aria-selected", "false");
                } else {
                    e.target.classList.add("active");
                    e.target.setAttribute("aria-selected", "true");
                }
                let selectedTexts = ""
                let sep = "";
                let nrActives = 0;
                let nrAll = 0;
                for (let i = 0; i < self.options.length; i++) {
                    nrAll++;
                    if (self.options[i].value == choiceValue) {
                        self.options[i].selected = !wasActive;
                    }
                    if (self.options[i].selected) {
                        nrActives++;
                        selectedTexts += sep + self.options[i].textContent;
                        sep = ",";
                    }
                }
                if (nrAll == nrActives) {
                    let wordForAll = self.userOptions.translations.all || "all";
                    selectedTexts = wordForAll;
                } else if (self.multipleSize != -1) {
                    if (nrActives > self.multipleSize) {
                        let wordForItems = self.userOptions.translations.items || "items"
                        selectedTexts = nrActives + " " + wordForItems;
                    }
                }
                self.title.textContent = selectedTexts;
                self.title.setAttribute("aria-label", selectedTexts);
                self.privateSendChange();
            }
            e.preventDefault();
            e.stopPropagation();
            if (self.userOptions.placeHolder != "" && self.title.textContent == "") {
                self.title.textContent = self.userOptions.placeHolder;
                self.title.setAttribute("aria-label", self.userOptions.placeHolder);
            }
        }

        function toggleDrop(e) {
            if (self.isDropShown) {
                self.drop.style.display = "none";
                self.isDropShown = false
            } else {
                self.drop.style.left = self.left + "px";
                self.drop.style.top = self.top + "px";
                self.drop.style.display = "block";
                document.addEventListener("click", docListener);
                e.preventDefault();
                e.stopPropagation();
                if (!self.userOptions.stayOpen) {
                    self.repositionMenu();
                }
                self.isDropShown = true
                self.ul.firstChild.focus();
            }
        }

        function changeFocusByArrowKeys(e) {
            let target = e.target;
            if (e.keyCode === 40) {
                let liList = self.ul.getElementsByTagName("li")
                let focus = false
                for (let i = 0; i < liList.length; i++) {
                    const li = liList[i]

                    if (focus) {
                        li.focus()
                        focus = false
                        break
                    }

                    if (target.id === li.id) {
                        focus = true
                    }
                }
            } else if (e.keyCode === 38) {
                let liList = self.ul.getElementsByTagName("li")
                let focus = false
                for (let i = liList.length - 1; i >= 0; i--) {
                    const li = liList[i]

                    if (focus) {
                        li.focus()
                        focus = false
                        break
                    }

                    if (target.id === li.id) {
                        focus = true
                    }
                }
            }
        }
    }
    this.init();
}

vanillaSelectBox.prototype.setValue = function (values) {
    let self = this;
    if (values == null || values == undefined || values == "") {
        self.empty();
    } else {
        if (self.isMultiple) {
            if (type(values) == "string") {
                if (values == "all") {
                    values = [];
                    Array.prototype.slice.call(self.options).forEach(function (x) {
                        values.push(x.value);
                    });
                } else {
                    values = values.split(",");
                }
            }
            let foundValues = [];
            if (type(values) == "array") {
                Array.prototype.slice.call(self.options).forEach(function (x) {
                    if (values.indexOf(x.value) != -1) {
                        x.selected = true;
                        foundValues.push(x.value);
                    } else {
                        x.selected = false;
                    }
                });
                let selectedTexts = ""
                let sep = "";
                let nrActives = 0;
                let nrAll = 0;
                Array.prototype.slice.call(self.listElements).forEach(function (x) {
                    nrAll++;
                    if (foundValues.indexOf(x.getAttribute("data-value")) != -1) {
                        x.classList.add("active");
                        x.setAttribute("aria-selected", "true");
                        nrActives++;
                        selectedTexts += sep + x.getAttribute("data-text");
                        sep = ",";
                    } else {
                        x.classList.remove("active");
                        x.setAttribute("aria-selected", "false");
                    }
                });

                if (nrAll == nrActives) {
                    let wordForAll = self.userOptions.translations.all || "all";
                    selectedTexts = wordForAll;
                } else if (self.multipleSize != -1) {
                    if (nrActives > self.multipleSize) {
                        let wordForItems = self.userOptions.translations.items || "items"
                        selectedTexts = nrActives + " " + wordForItems;
                    }
                }
                self.title.textContent = selectedTexts;
                self.title.setAttribute("aria-label", selectedTexts);
                self.privateSendChange();
            }
        } else {
            let found = false;
            let text = "";
            let classNames = ""
            Array.prototype.slice.call(self.listElements).forEach(function (x) {
                if (x.getAttribute("data-value") == values) {
                    x.classList.add("active");
                    x.setAttribute("aria-selected", "true");
                    found = true;
                    text = x.getAttribute("data-text")
                } else {
                    x.setAttribute("aria-selected", "false");
                    x.classList.remove("active");
                }
            });
            Array.prototype.slice.call(self.options).forEach(function (x) {
                if (x.value == values) {
                    x.selected = true;
                    className = x.getAttribute("class");
                    if (!className) className = "";
                } else {
                    x.selected = false;
                }
            });
            if (found) {
                self.title.textContent = text;
                if (self.userOptions.placeHolder != "" && self.title.textContent == "") {
                    self.title.textContent = self.userOptions.placeHolder;
                    self.title.setAttribute("aria-label", self.userOptions.placeHolder);
                }
                if (className != "") {
                    self.title.setAttribute("class", className + " title");
                } else {
                    self.title.setAttribute("class", "title");
                }
            }
        }
    }
    function type(target) {
        const computedType = Object.prototype.toString.call(target);
        const stripped = computedType.replace("[object ", "").replace("]", "");
        const lowercased = stripped.toLowerCase();
        return lowercased;
    }
}

vanillaSelectBox.prototype.privateSendChange = function () {
    let event = document.createEvent('HTMLEvents');
    event.initEvent('change', true, false);
    this.root.dispatchEvent(event);

}

vanillaSelectBox.prototype.empty = function () {
    Array.prototype.slice.call(this.listElements).forEach(function (x) {
        x.classList.remove("active");
    });
    Array.prototype.slice.call(this.options).forEach(function (x) {
        x.selected = false;
    });
    this.title.textContent = "";
    if (this.userOptions.placeHolder != "" && this.title.textContent == "") {
        this.title.textContent = this.userOptions.placeHolder;
        this.title.setAttribute("aria-label", this.userOptions.placeHolder);
    }
    this.privateSendChange();
}

vanillaSelectBox.prototype.destroy = function () {
    let already = document.getElementById("btn-group-" + this.domSelector);
    if (already) {
        already.remove();
        this.root.style.display = "inline-block";
    }
}
vanillaSelectBox.prototype.disable = function () {
    let already = document.getElementById("btn-group-" + this.domSelector);
    if (already) {
        button = already.querySelector("button")
        if(button) button.classList.add("disabled");
        this.isDisabled = true;
    }
}
vanillaSelectBox.prototype.enable = function () {
    let already = document.getElementById("btn-group-" + this.domSelector);
    if (already) {
        button = already.querySelector("button")
        if(button) button.classList.remove("disabled");
        this.isDisabled = false;
    }
}

vanillaSelectBox.prototype.showOptions = function(){
    console.log(this.userOptions);
}
// Polyfills for IE
if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function () {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}
