/* Copyright (c) 2020 - hacked.design - Ben Wise */

'use strict';

class point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

var style = {
    fontColor: "black",
    font: "10px sans-serif",
    titleFont: "16px sans-serif",
    titleFontColor: "black",
    timelineLabelFont: "10px sans-serif",
    timelineLabelFontColor: "black",
    padding: 20,
    diagramAreaBorderColor: "lightgray",
    treeLineStrokeColor: "black",
    drawBranchOutlines: true,
    branchOutlineStrokeColor: "lightslategrey",
    branchOutlineDash: [4, 2],
    diagramTitleHeight: 40,
    treeLevelWidth: 100,
    treeBranchHeight: 50,
    timelineWidth: 1000,
    timelineBoxHeight: 20,
    timelineAxisLabelHeight: 40,
    alignLeafLabel: "right",
    fillSaturation: 0.5,
    fillLight: 0.75,
    strokeSaturation: 0.5,
    strokeLight: 0.25,
    showPeriodBackground: false,
    showPeriodLines: false,
    periodSaturation: 0.5,
    periodLight: 0.9,
    drawImages: true,
    imageMaxWidth: 100,
    drawAreaOutlines: true,
    drawOffTimelineArrows: true
};

class timeline {
    constructor(title, periods, tree, start, end, units, style) {
        this.canvas = this.getCanvas();
        this.context = this.canvas.getContext("2d");
        this.context.lineWidth = 1;
        this.diagramTitle = title;
        this.periods = periods;
        this.treeArray = tree;
        this.tree = {};
        this.start = start;
        this.end = end;
        this.units = units;
        this.style = style;
        this.timelineRect = new rect(this.style.padding, this.style.padding + this.style.diagramTitleHeight, this.canvas.width - this.style.padding, this.canvas.height - 100 - this.style.padding);
        this.treeRect = new rect(this.style.padding, this.style.padding + this.style.diagramTitleHeight, this.canvas.width - (2 * this.style.padding), this.canvas.height - 100 - this.style.padding);
        this.timelineAxisTop = this.timelineRect.y + this.timelineRect.height + this.style.padding;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getCanvas() {
        return document.getElementById("timeline")
    }

    hsl(hue, sat, light) {
        return 'hsla(' + hue + ', ' + sat * 100 + '%, ' + light * 100 + '%, 1)';
    }

    drawTitle() {
        this.context.textAlign = "center";
        this.context.font = this.style.titleFont;
        this.context.fillStyle = this.style.titleFontColor;
        this.context.fillText(this.diagramTitle + " (" + this.start + this.units + " to " + this.end + this.units + ")", this.canvas.width / 2, this.style.padding + (this.style.diagramTitleHeight / 2));
    }

    drawAreaOutline(r) {
        this.context.strokeStyle = this.style.diagramAreaBorderColor;
        this.context.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    }

    drawTimelineAxisBox(name, startPercent, endPercent, hue) {
        const r = new rect(Math.round(this.timelineRect.x + (this.timelineRect.w * startPercent)), this.timelineAxisTop, Math.round(this.timelineRect.w * endPercent - (this.timelineRect.w * startPercent)), this.style.timelineAxisLabelHeight);
        this.context.fillStyle = this.hsl(hue, this.style.fillSaturation, this.style.fillLight);
        this.context.strokeStyle = this.hsl(hue, this.style.strokeSaturation, this.style.strokeLight);
        this.context.fillRect(r.x, r.y, r.w, r.h);
        this.context.strokeRect(r.x, r.y, r.w, r.h);
        this.context.font = this.style.timelineLabelFont;
        this.context.fillStyle = this.style.timelineLabelFontColor;
        this.context.textAlign = "center";
        this.context.fillText(name, r.x + (r.w / 2), r.y + (r.h / 2));
        if (this.style.showPeriodBackground) {
            this.context.fillStyle = this.hsl(hue, this.style.periodSaturation, this.style.periodLight);
            this.context.fillRect(r.x, this.timelineRect.y, r.w, this.timelineRect.h);
        }

        if (this.style.showPeriodLines) {
            this.context.strokeStyle = this.hsl(hue, this.style.strokeSaturation, this.style.strokeLight);
            this.context.beginPath();
            this.context.moveTo(r.x, this.timelineRect.y);
            this.context.lineTo(r.x, this.timelineRect.y + this.timelineRect.h);
            this.context.strokeStyle = this.style.branchOutlineStrokeColor;
            this.context.stroke();
        }
    }

    drawTreeBranch(name, top, treeLevel, height) {
        const p1 = new point(Math.round(this.treeRect.x + (treeLevel * this.style.treeLevelWidth)), Math.round(this.treeRect.y + (top * this.style.treeBranchHeight) + ((height * this.style.treeBranchHeight) / 2)));
        const p2 = new point(p1.x + this.style.treeLevelWidth, p1.y);
        this.context.strokeStyle = this.style.treeLineStrokeColor;
        this.context.beginPath();
        this.context.moveTo(p1.x, p1.y);
        this.context.lineTo(p2.x, p2.y);
        this.context.stroke();
        this.context.fillStyle = this.style.fontColor;
        this.context.font = this.style.font;
        this.context.textAlign = "left";
        this.context.fillText(name, p1.x + 5, p1.y - 5);
    }

    drawTreeLeafUnknown(name, top, treeLevel, height) {
        const p1 = new point(this.treeRect.x + (treeLevel * this.style.treeLevelWidth), Math.round(this.treeRect.y + (top * this.style.treeBranchHeight)) + Math.round((height * this.style.treeBranchHeight) / 2));

        this.context.strokeStyle = this.style.treeLineStrokeColor;
        this.context.beginPath();
        this.context.moveTo(p1.x, p1.y);
        this.context.lineTo(this.timelineRect.x, p1.y);
        this.context.stroke();

        this.context.font = this.style.font;
        this.context.fillStyle = this.style.fontColor;

        switch (this.style.alignLeafLabel) {
            case "right":
                this.context.textAlign = "right";
                this.context.fillText(name, this.timelineRect.x - 5, p1.y - 5);
                break;
            case "left":
                this.context.textAlign = "left";
                this.context.fillText(name, p1.x + 5, p1.y - 5);
                break;
            case "center":
                this.context.textAlign = "center";
                this.context.fillText(name, (p1.x + this.timelineRect.x) / 2, p1.y - 5);
                break;
        }

        this.context.textAlign = "left";
        this.context.fillText("?", this.timelineRect.x + 5, p1.y);
    }

    drawTreeLeaf(name, top, treeLevel, start, end, height, hue, src) {
        const x1 = this.treeRect.x + (treeLevel * this.style.treeLevelWidth);
        //var x2 = x1 + this.style.treeLevelWidth;
        const y1 = Math.round(this.treeRect.y + (top * this.style.treeBranchHeight));
        const y2 = Math.round(height * this.style.treeBranchHeight);
        const y3 = y1 + Math.round((height * this.style.treeBranchHeight) / 2);

        let startArrow = false;
        let endArrow = false;

        if (start < 0) {
            startArrow = true;
            start = 0;
        }

        if (end < 0) {
            startArrow = true;
            end = 0;
        }

        if (start > 1) {
            start = 1;
            endArrow = true;
        }

        if (end > 1) {
            end = 1;
            endArrow = true;
        }


        const startx = Math.round(this.timelineRect.w * start);
        const width = Math.round(this.timelineRect.w * end - startx);

        this.context.strokeStyle = this.style.treeLineStrokeColor;
        this.context.beginPath();
        this.context.moveTo(x1, y3);
        this.context.lineTo(this.timelineRect.x + startx, y3);
        this.context.stroke();

        this.context.font = this.style.font;
        this.context.fillStyle = this.style.fontColor;

        switch (this.style.alignLeafLabel) {
            case "right":
                this.context.textAlign = "right";
                this.context.fillText(name, this.timelineRect.x + startx - 5, y3 - 5);
                break;
            case "left":
                this.context.textAlign = "left";
                this.context.fillText(name, x1 + 5, y3 - 5);
                break;
            case "center":
                this.context.textAlign = "center";
                this.context.fillText(name, (x1 + this.timelineRect.x + startx) / 2, y3 - 5);
                break;
        }


        this.context.fillStyle = this.hsl(hue, this.style.fillSaturation, this.style.fillLight);
        this.context.strokeStyle = this.hsl(hue, this.style.strokeSaturation, this.style.strokeLight);
        this.context.fillRect(this.timelineRect.x + startx, y1 + (y2 / 2) - (this.style.timelineBoxHeight / 2), width, this.style.timelineBoxHeight);
        this.context.strokeRect(this.timelineRect.x + startx, y1 + (y2 / 2) - (this.style.timelineBoxHeight / 2), width, this.style.timelineBoxHeight);

        if (startArrow) {
            this.context.strokeStyle = this.style.treeLineStrokeColor;
            this.context.beginPath();
            this.context.moveTo(this.timelineRect.x + 7, y3 - 5);
            this.context.lineTo(this.timelineRect.x + 2, y3);
            this.context.lineTo(this.timelineRect.x + 7, y3 + 5);
            this.context.stroke();
        }

        if (endArrow) {
            this.context.strokeStyle = this.style.treeLineStrokeColor;
            this.context.beginPath();
            this.context.moveTo(this.timelineRect.x + this.timelineRect.w - 7, y3 - 5);
            this.context.lineTo(this.timelineRect.x + this.timelineRect.w - 2, y3);
            this.context.lineTo(this.timelineRect.x + this.timelineRect.w - 7, y3 + 5);
            this.context.stroke();
        }

        if (this.style.drawImages && !endArrow) {
            this.drawLeafImage(this.timelineRect.x + startx + width + 15, y1, this.style.treeBranchHeight, src);
        }
    }

    drawLeafImage(x, y, maxHeight, src) {
        if (typeof src !== 'undefined') {
            let img = new Image();
            img.crossOrigin = '';
            img.addEventListener('load', () => {

                let canvasRatio = (this.style.imageMaxWidth / maxHeight);
                if ((img.width / img.height) < canvasRatio) {
                    let newWidth = maxHeight * img.width / img.height;
                    this.context.drawImage(img, x, y, newWidth, maxHeight);
                } else {
                    let newHeight = this.style.imageMaxWidth * img.height / img.width;
                    let newY = y + (maxHeight / 2) - (newHeight / 2)
                    this.context.drawImage(img, x, newY, this.style.imageMaxWidth, newHeight);
                }
            }, false);
            img.src = src;

        }
    }

    drawTreeBranchVert(top, height, treeLevel) {
        const p1 = new point(Math.round(this.treeRect.x + ((treeLevel + 1) * this.style.treeLevelWidth)), Math.round(this.treeRect.y + (top * this.style.treeBranchHeight)));
        const p2 = new point(p1.x, Math.round(p1.y + (height * this.style.treeBranchHeight)));
        this.context.strokeStyle = this.style.treeLineStrokeColor;
        this.context.beginPath();
        this.context.moveTo(p1.x, p1.y);
        this.context.lineTo(p2.x, p2.y);
        this.context.stroke();
    }

    drawTimelineTreeOutlineBox(top, start, end, height, hue) {
        const r = new rect(this.timelineRect.x + Math.round(this.timelineRect.w * start), Math.round(this.treeRect.y + (top * this.style.treeBranchHeight)), Math.round(this.timelineRect.w * end - (this.timelineRect.w * start)), Math.round(height * this.style.treeBranchHeight));
        this.context.strokeStyle = this.style.branchOutlineStrokeColor;
        const old = this.context.getLineDash();
        this.context.setLineDash(this.style.branchOutlineDash);
        this.context.strokeRect(r.x, r.y, r.w, r.h);
        this.context.setLineDash(old);
    }

    drawTree(branch, top, treeLevel, totalTreeHeight) {
        let branchTop = top;
        let nextHeight = 0;
        let branchVertTop = 0;
        let branchVertBottom = 0;
        let branchHeight = this.calcBranchHeight(branch);

        if (typeof branch.branches !== 'undefined' && branch.branches.length > 0) {
            this.drawTreeBranch(branch.name, top, treeLevel, branchHeight);
            for (let i = 0; i < branch.branches.length; i++) {
                branchTop += nextHeight;
                nextHeight = this.drawTree(branch.branches[i], branchTop, treeLevel + 1, totalTreeHeight);

                if (i == 0) {
                    branchVertTop = branchTop + (nextHeight * 0.5);
                }
                if (i == (branch.branches.length - 1)) {
                    branchVertBottom = branchTop + (nextHeight * 0.5) - branchVertTop;
                }
            }
            this.drawTreeBranchVert(branchVertTop, branchVertBottom, treeLevel);

            if (this.style.drawBranchOutlines && typeof branch.start !== 'undefined') {
                let pstart = Math.max(this.calcTimelinePercent(branch.start), 0);
                let pend = Math.min(this.calcTimelinePercent(branch.end), 1);
                this.drawTimelineTreeOutlineBox(top, pstart, pend, branchHeight, top / totalTreeHeight * 360);
            }
        } else {
            if (typeof branch.start === 'undefined') {
                this.drawTreeLeafUnknown(branch.name, top, treeLevel, branchHeight);
            } else {
                let pstart = this.calcTimelinePercent(branch.start);
                let pend = this.calcTimelinePercent(branch.end);

                //pstart = Math.max(this.calcTimelinePercent(branch.start), 0);
                //pend = Math.min(this.calcTimelinePercent(branch.end), 1);


                this.drawTreeLeaf(branch.name, top, treeLevel, pstart, pend, branchHeight, top / totalTreeHeight * 360, branch.image);
            }
        }

        return branchHeight;
    }

    calcBranchHeight(branch) {
        let height = 0;

        if (typeof branch.branches !== 'undefined' && branch.branches.length > 0) {
            for (let i = 0; i < branch.branches.length; i++) {
                height += this.calcBranchHeight(branch.branches[i]);
            }
        } else {
            height = 1;
        }

        return height;
    };

    calcBranchDepth(branch) {
        let childDepth = 0;

        if (typeof branch.branches !== 'undefined' && branch.branches.length > 0) {
            for (let i = 0; i < branch.branches.length; i++) {
                childDepth = Math.max(childDepth, this.calcBranchDepth(branch.branches[i]));
            }
        }
        return 1 + childDepth;
    }

    calcTimelinePercent(time) {
        return (time - this.start) / (this.end - this.start);
    }

    drawTimelineAxisLabel() {
        for (let i = 0; i < this.periods.length; i++) {
            const p = this.periods[i];
            if (p.end < this.start)
                continue;
            if (p.start > this.end)
                continue;
            const pstart = Math.max(this.calcTimelinePercent(p.start), 0);
            const pend = Math.min(this.calcTimelinePercent(p.end), 1);
            this.drawTimelineAxisBox(p.name, pstart, pend, (i / this.periods.length * 360));
        }
    }

    resizeDrawingAreas() {
        const treeDepth = this.calcBranchDepth(this.tree);
        const treeHeight = this.calcBranchHeight(this.tree);
        this.treeRect.w = this.style.treeLevelWidth * treeDepth;
        this.treeRect.h = treeHeight * this.style.treeBranchHeight + (2 * this.style.padding);
        this.timelineRect.x = this.treeRect.x + this.treeRect.w + this.style.padding;
        this.timelineRect.w = this.style.timelineWidth;
        this.timelineRect.h = this.treeRect.h;
        this.timelineAxisTop = this.timelineRect.y + this.timelineRect.h + this.style.padding;
        this.canvas.height = this.style.diagramTitleHeight + this.treeRect.h + this.style.timelineAxisLabelHeight + (this.style.showYearLabels ? this.style.padding : 0) + (3 * this.style.padding) + 2;
        this.canvas.width = this.treeRect.w + this.timelineRect.w + (3 * this.style.padding) + 2;
        this.context.translate(0.5, 0.5);

        return treeHeight;
    }

    constructTree() {
        let map = {};
        var roots = [];

        for (let i = 0; i < this.treeArray.length; i++) {

            map[this.treeArray[i].id] = i;
            this.treeArray[i].branches = [];
        }

        for (let i = 0; i < this.treeArray.length; i++) {
            let node = this.treeArray[i];
            if (node.parent !== "") {
                this.treeArray[map[node.parent]].branches.push(node);
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

    draw() {
        let roots = this.constructTree();
        if (roots.length == 0) {
            console.log("No tree root found");
            return;
        }
        this.tree = roots[0];
        const treeHeight = this.resizeDrawingAreas();
        this.context.fillStyle = "white";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTitle();

        this.drawTimelineAxisLabel();
        this.drawTree(this.tree, 0, 0, treeHeight);
        if (this.style.drawAreaOutlines) {
            this.drawAreaOutline(this.treeRect);
            this.drawAreaOutline(this.timelineRect);
        }

    }
}