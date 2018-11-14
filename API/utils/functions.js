
/**
* Parse matches from string and remove any line containing a match
* @param {string} str The string to parse
* @returns {Object} result
* @returns {string[]} result.matches
* @returns {string} result.cleanedText
*/
const removeByRegex = (str, regex) => {
 const matches = [];
 const cleanedText = str
   .split('\n')
   .filter(line => {
     const hits = line.match(regex);
     if (hits != null) {
       matches.push(hits[0]);
       return false;
     }
     return true;
   })
   .join('\n');
 return { matches, cleanedText };
};
// from http://emailregex.com
const emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
 const removeEmails = str => {
 const { matches, cleanedText } = removeByRegex(str, emailRegex);
 return { emails: matches, stringWithoutEmails: cleanedText };
};
// Regex taken from https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
const postcodeRegex = /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))\s?[0-9][A-Za-z]{2})/i;
 const removePostcodes = str => {
 const { matches, cleanedText } = removeByRegex(str, postcodeRegex);
 return { postcodes: matches.map(s => s.toUpperCase()), stringWithoutPostcodes: cleanedText };
};
// from http://www.regexlib.com/REDetails.aspx?regexp_id=589
const UKphoneRegex = /((\(?0\d{4}\)?\s?\d{3}\s?\d{3})|(\(?0\d{3}\)?\s?\d{3}\s?\d{4})|(\(?0\d{2}\)?\s?\d{4}\s?\d{4}))(\s?\#(\d{4}|\d{3}))?/;
 const removePhonenumbers = str => {
 const { matches, cleanedText } = removeByRegex(str, UKphoneRegex);
 return { phonenumbers: matches, stringWithoutPhonenumbers: cleanedText };
};
// from https://stackoverflow.com/a/20046959
const domainRegex = /[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\.[a-zA-Z]{2,3})/;
 const removeDomains = str => {
 const { matches, cleanedText } = removeByRegex(str, domainRegex);
 return { domains: matches, stringWithoutDomains: cleanedText };
};

const validatePostCode = code => {
  var re = /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))\s?[0-9][A-Za-z]{2})/i;
  return re.test(String(code));
}
const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
const validateDomain = (domain) =>{
var re = /[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\.[a-zA-Z]{2,3})/;
return re.test(String(domain).toLowerCase())        
}
const validatePhoneNumber = (num) => {
var re = /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/;
return re.test(String(num));
}

const ValidateAddress = (cleanedText , countryCode) => {
  // console.log(cleanedText);
  // cleanedText = cleanedText.replace(/-/g, '')
  // console.log(cleanedText);
 
  try{
    let pAddress = "";
    if(pAddress == "") 
       pAddress = cleanedText.match(/[][ABCDEFGHIGKLMNOPQRSTUVWXYZ][- ]\d{3}[ ,]/g);
    if(pAddress == null)
       pAddress = cleanedText.match(/[ ]\d{3}[ ,]/g);
    if(pAddress == null) 
       pAddress = cleanedText.match(/[ ]\d{2}[ ,]/g);
    if(pAddress == null) 
       pAddress = cleanedText.match(/[ ]\d{4}[ ,]/g);
    if(pAddress == null) 
       pAddress = cleanedText.match(/[ ]\d{5}[ ,]/g);
    
    // console.log(pAddress)
    let PostCode = [];
  if(countryCode == "CA") {
    PostCode = cleanedText.match(/[ABCEGHJKLMNPRSTVXY]\d{1}[ABCEGHJ-NPRSTV-Z]?[- ]?\d{1}[ABCEGHJ-NPRSTV-Z]\d{1}/g);
  }
  if(countryCode == "US") {
    PostCode = cleanedText.match(/\d{5}([ \-]\d{4})?/g);
  }
  // console.log("postCOdein func" , PostCode)
  // console.log(pAddress)
  let repText = cleanedText.replace(PostCode , "testPostCode");
  repText = repText.replace(pAddress , " testpAddress ");
  repText = repText.replace(/,/g, '');
  repText = repText.replace(/\./g, "");
  const token = repText.split(" ");
  const index = token.indexOf("testPostCode");
  const fIndex = token.indexOf("testpAddress");
  const diff = index - fIndex;
  // console.log("token" , token);
  // console.log(index);
  // console.log(fIndex)
  // console.log(diff);
  // console.log("index " , index)
  if(index != '-1') { // ZipCode Found
    if(fIndex != '-1') { // pAddress Found
        let test = ''
        for(i=1 ; i< diff ; i++) {
            test += token[fIndex + i] + " "
        }
        return {
          zipCode : PostCode,
          // Province : token[fIndex + (diff -1)],
          // City : token[fIndex + (diff -2)],
          //Direction : token[fIndex + (diff - 3)] + " " + token[fIndex + (diff - 4)],
          //Street : token[fIndex + (diff - 5)] + " " + token[fIndex + (diff - 6)] + " " + token[fIndex + (diff - 7)] + " " + token[fIndex + (diff - 8)],
          PhysicalAddress : pAddress + " " + test , 
          countryCodeError : false
        }
    } else { // pAddress Not Found
      return {
        zipCode : PostCode,
        PhysicalAddress : token[index-5] + " " + token[index-4] + " " + token[index-3] + " " + token[index-2] + " " + token[index-1], 
        countryCodeError : false
      }
    }
  } else {  // ZipCode Not Found
    if(fIndex != '-1') { // pAddress Found
      return {
        zipCode : [null],
        PhysicalAddress : pAddress + " " + token[fIndex+1] + " " + token[fIndex+2] + " " + token[fIndex+3] + " " + token[fIndex+4], 
        countryCodeError : false
      }
    } else { // pAddress Not Found
      return {
        zipCode : [null],
        PhysicalAddress : "Something Went Wrong", 
        countryCodeError : false
      }
    }
  }

} catch (err) {
    console.log("Something Went Wrong During Parsing Address")
  }
}



module.exports = {
    removeEmails,
    removePostcodes,
    removePhonenumbers,
    removeDomains,
    validateEmail,
    validateDomain,
    validatePhoneNumber,
    validatePostCode,
    ValidateAddress
}



// if (PostCode === null) {
//   PostCode = ['null']
//   return {
//     zipCode : PostCode,
//     Province : "",
//     City : "",
//     Street : "",
//     PhysicalAddress : "",
//     countryCodeError : true
//   }
// } else {
//   console.log(token[index-4])
// //  console.log(token[index-4] == (('east') || ('East') || ('west') || ('West') || ('South') || ('south') || ('North' )|| ('north')))
//   if((token[index-4] ==='east' || token[index-4] ==='East' || token[index-4] ==='west' ||token[index-4] === 'West' ||token[index-4] === 'South' ||token[index-4] ==='south' ||token[index-4] === 'North' || token[index-4] ==='north')){
//     return {
//       zipCode : PostCode,
//       Province : token[index-1],
//       City : token[index-2],
//       Direction : token[index-4] + " " + token[index-3],
//       Street : token[index-6] + " " + token[index-5],
//       PhysicalAddress : token[index-7],
//       countryCodeError : false,
//       direc : true
//     }
//   }else {
//     return {
//       zipCode : PostCode,
//       Province : token[index-1],
//       City : token[index-2],
//       Direction : false,
//       Street : token[index-3],
//       PhysicalAddress : token[index-4],
//       countryCodeError : false,
//       direc : false
//     }
//   }