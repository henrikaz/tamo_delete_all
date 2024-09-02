let clicksToMake = 20;
let clickCount = 0;
 
function clickButton() {
    const button = document.querySelector('.text-right .v-btn.v-btn--icon.v-btn--variant-text');  

    if (button) {
        button.click();  
        clickCount++;  
        console.log(`Button clicked ${clickCount} times.`);

        if (clickCount >= clicksToMake) { 
            clearInterval(clickInterval); 
            console.log('Clicking stopped after 100 clicks.');
            console.log(`Clicking stopped after ${clicksToMake} clicks.`); 
        }
    } else {
        console.log('Button not found.');
    }
}

const clickInterval = setInterval(clickButton, 2000);
