const fs = require('fs');
const content = fs.readFileSync('d:\\fikri kuliah\\semester 4\\project\\lavira\\src\\screen\\main\\sppg\\HomeScreenSppg.js', 'utf8');

function checkTags(tagName) {
    let balance = 0;
    let lines = content.split('\n');

    lines.forEach((line, i) => {
        let regexOpen = new RegExp('<' + tagName + '(\\s|>)', 'g');
        let regexClose = new RegExp('</' + tagName + '>', 'g');
        let regexSelf = new RegExp('<' + tagName + '[^>]*/>', 'g');

        let lineOpens = (line.match(regexOpen) || []).length;
        let lineCloses = (line.match(regexClose) || []).length;
        let lineSelf = (line.match(regexSelf) || []).length;

        for (let k=0; k<lineOpens; k++) {
            balance++;
            // console.log(`${i+1}: OPEN ${tagName} (Balance: ${balance})`);
        }
        for (let k=0; k<lineSelf; k++) {
            balance--;
            // console.log(`${i+1}: SELF ${tagName} (Balance: ${balance})`);
        }
        for (let k=0; k<lineCloses; k++) {
            balance--;
            if (balance < 0) {
                console.log(`ERROR: Extra closing ${tagName} at line ${i+1}`);
            }
        }
    });
}

checkTags('ScrollView');
checkTags('View');
checkTags('TouchableOpacity');
