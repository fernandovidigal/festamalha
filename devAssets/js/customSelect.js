function closeAllCheckboxes(selectBoxesDropList, selectBoxes) {
    for (let i = 0; i < selectBoxesDropList.length; i++) {
        selectBoxes[i].classList.remove("customSelect__header-open");
        selectBoxesDropList[i].classList.remove("customSelect__list-open");
        selectBoxesDropList[i].removeAttribute('style');
    }
}

// SELECTBOXES
const selectBoxes = document.querySelectorAll('.customSelect__header');
const selectBoxesDropList = document.querySelectorAll('.customSelect__list');
selectBoxes.forEach((selectBox, index) => {
    selectBox.addEventListener('click', function (e) {
        e.stopPropagation();

        if (selectBoxesDropList[index].classList.contains('customSelect__list-open')) {
            this.classList.remove("customSelect__header-open");
            selectBoxesDropList[index].classList.remove('customSelect__list-open');
        } else {
            closeAllCheckboxes(selectBoxesDropList, selectBoxes);
            this.classList.add("customSelect__header-open");
            const headerSelectDimensions = this.getBoundingClientRect();

            selectBoxesDropList[index].classList.add('customSelect__list-open');
            const listSelectDimensions = selectBoxesDropList[index].getBoundingClientRect();

            const windowHeight = window.innerHeight;
            const selectHeight = listSelectDimensions.height;
            const selectYPos = listSelectDimensions.y;
            const selectTop = listSelectDimensions.top - headerSelectDimensions.height;
            const selectSpan = selectYPos + selectHeight;
            const minHeight = 225; // O minímo é 180, ou seja 225 * 0.80 = 180
            const maxHeight = 400;

            if (selectYPos > windowHeight) {
                selectBoxesDropList[index].style.top = ((selectHeight + 7) * -1) + 'px';
            } else if (selectSpan > windowHeight) {

                const remainDownHeight = windowHeight - selectYPos;
                if (remainDownHeight >= minHeight) {
                    selectBoxesDropList[index].style.height = (remainDownHeight * 0.80) + 'px';
                } else {
                    if (selectTop < maxHeight && selectTop >= minHeight) {
                        selectBoxesDropList[index].style.height = (selectTop * 0.80) + 'px';
                        selectBoxesDropList[index].style.top = (((selectTop * 0.80) + 7) * -1) + 'px';
                    } else {
                        selectBoxesDropList[index].style.top = ((selectHeight + 7) * -1) + 'px';
                    }
                }
            }
        }
    });
});

document.addEventListener('click', function () {
    closeAllCheckboxes(selectBoxesDropList, selectBoxes);
});