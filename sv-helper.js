/*
oracle and consequences methods use tables from:
https://guimonocores.itch.io/omens-in-the-dark
*/

/* utils */
class Utils {
    constructor() {}
    rollDie(sides) {
        return Math.floor((Math.random() * sides) + 1);
    }
    rollD6() { return this.rollDie(6); }
    rollD10() { return this.rollDie(10); }
    rollD100() { return this.rollDie(100); }
    arrayToSentence(arr) {
        	if (arr.length == 1) {
        		return arr[0];
        	} else {
            let last = arr.pop();
        		return arr.join(', ') + ' and ' + last;
        	}
    }
    numberToArray(n) {
        return Array.from(String(n), Number);
        // return Array.from(n.toString()).map(Number);
    }
    getRandom(arr, n=1) {
        let result = new Array(n);
        let len = arr.length;
        let taken = new Array(len);
        if (n > len) {
            throw new RangeError("getRandom: more elements taken than available");
        }
        while (n--) {
            let x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result
    }
    getClosestKey(arr, target, u) {
        if (arr.hasOwnProperty(target)) {
            return target;
        }
        let keys = Object.keys(arr);
        keys.sort(function(a,b){ return a-b; });

        for(var i = 0, prev; i < keys.length; i++){
            if (Number(keys[i]) > target) {
                return prev === u ? u : +prev;
            }
            prev = keys[i];
        }
        return +keys[i - 1];
    }
}

const u = new Utils();


class SVHelper {
    constructor() {
        this.harm_levels = ["Severe","Moderate","Lesser"];
        this.effect_levels = ["Great","Standard","Limited"];
        this.positions = ["controlled","risky","desperate"];
        this.probabilities = ["Impossible","Almost Impossible","Very Unlikely","Unlikely","50/50","Very Likely","Likely","Near Sure Thing","A Sure Thing"];
        this.npc_attitudes = ["Hostile","Neutral","Friendly"];
        this.complication_levels = ["Serious","Standard","Minor"];
        this.consequences = ["Reduced Effect","Complication","Lost Opportunity","Worse Position","Harm"];
        this.publicMethods = ["action","oracle","consequence","fortune","npcReaction","resist"];
    }
    
    get random_consequence() {
        return this.consequences[Math.floor(Math.random() * this.consequences.length)];
    }
    
    _base_dice_roll(num_to_roll=0,use_lowest=false) {
        let rolls = [];
        let status = "";
        let highest = 1;
        
        // if no dice, you always roll two and take the lowest number
        if (num_to_roll == 0) {
            use_lowest = true;
            num_to_roll = 2;
        }
        
        // roll the number of dice        
        let i = 0;
        do {
            i += 1;
            rolls.push(u.rollD6());
        } while (i < num_to_roll);
        
        // if no dice, you always roll two and take the lowest number        
        if (use_lowest == true) {
            highest = Math.min.apply(null, rolls);        
        } else {
            highest = Math.max.apply(null, rolls);
        }
        
        // measure the level of success
        if (highest > 5) {
            status = "full success";
        } else if (highest > 3) {
            status = "partial success";
        } else {
            status = "bad outcome";
        }
        
        // did they crit?
        let six_count = 0;
        for(let i = 0; i < rolls.length; ++i){
            if(rolls[i] == 6) {
                six_count++;
            }
        }
        
        if (six_count > 1) {
            status = "critical";
        }    
        
        return {
            "rolls": rolls,
            "highest": highest,
            "status": status
        }
    }
    
    action(rating=0,position="Risky",effect_level="standard",push_yourself=false,devils_bargain=false,spend_a_gambit=false,crew_assisted=false) {
        // @@SPM deal with lowering/raising the effect level
                
        // let's deal with bonus die
        let bonus_die = 0;
        if (push_yourself == true && devils_bargain == true) {
            throw "You may not Push Yourself and accept a Devil's Bargain.";
        }        
        if (push_yourself) { bonuse_die +=1; }
        if (devils_bargain) { bonuse_die +=1; }
        if (spend_a_gambit) { bonuse_die +=1; }
        if (crew_assisted) { bonuse_die +=1; }
 
        // setup our roll result
        let roll = this._base_dice_roll(rating+bonus_die);

        // determine the outcome
        let effect = "";
        let new_position = "";
        let complication = "";
        let harm = "";
        let result = "";
        let gambit_gained = false;
        let lost_oppurtunity = false;
        
        if (position == "controlled") {
            if (roll.status == "critical") {
                effect = "increased";
                result = "You do it.";
            } else if (roll.status == "full success") {
                result = "You do it.";
            } else if (roll.status == "partial success") {
                effect = "reduced";
                complication = "minor";
                harm = "lesser";
                result = "You hesistate. Withdraw and try another approach.";
            } else {
                new_position = "risky";
                result = "You are blocked.";
            }
        } else if (position == "desperate") {
            if (roll.status == "critical") {
                effect = "increased";
                result = "You do it.";
            } else if (roll.status == "full success") {
                result = "You do it.";
            } else if (roll.status == "partial success") {
                complication = "serious";
                harm = "severe";
                result = "You do it, but...";
            } else {
                complication = "serious";
                harm = "severe";
                lost_oppurtunity = true;
                result = "It is the worst outcome.";
            }
        } else {
            // risky
            if (roll.status == "critical") {
                effect = "increased";
                gambit_gained = true;
                result = "You do it.";
            } else if (roll.status == "full success") {
                result = "You do it.";
                gambit_gained = true;                
            } else if (roll.status == "partial success") {
                new_position = "desperate";
                complication = "standard";
                effect = "reduced";
                harm = "moderate";
                result = "You do it, but...";
            } else {
                new_position = "desperate";
                complication = "standard";
                harm = "moderate";
                lost_oppurtunity = true;
                result = "Things go badly.";
            }
        }
        
        return {
            "roll": roll,
            "effect": effect,
            "new_position": new_position,
            "complication": complication,
            "harm": harm,
            "gambit_gained": gambit_gained,
            "lost_oppurtunity": lost_oppurtunity
        }   
    }
    
    oracle(probability="50/50") {
            
        let probability_ratings = {
            "Impossible": 5,
            "Almost Impossible": 4,
            "Very Unlikely": 3,
            "Unlikely": 2,
            "50/50": 1,
            "Very Likely": 2,
            "Likely": 3,
            "Near Sure Thing": 4,
            "A Sure Thing": 5
        }
        
        let use_lowest_probabilities = ["Impossible","Almost Impossible","Very Unlikely","Unlikely"];
        let use_lowest = false;
        
        if (use_lowest_probabilities.includes(probability_ratings)) {
            use_lowest = true;
        }
        
        let rating = probability_ratings[probability];
        
        let roll = this._base_dice_roll(rating,use_lowest);
        let result = "";

        if (roll.status == "critical") {
            result = "Yes and...";
        } else if (roll.status == "full success") {
            result = "Yes";
        } else if (roll.status == "partial success") {
            result = "Yes, but...";
        } else {
            if (roll.highest == 3) {
                result = "No, because...";
            } else if (roll.highest == 2) {
                result = "No";
            } else {
                result = "Complication";
            }
        }

        return {
            "roll": roll,
            "result": result
        }        
    }
    
    consequence(position="risky",complication="standard",highest=1) {
        let rating = 0;
        let result = "";
        if (position == "risky") {
            if (highest < 6 && highest > 3) {
                rating = 1;
            } else if (highest < 4) {
                rating = 2;
            }
        } else if (position == "desperate") {
            if (highest < 6 && highest > 3) {
                rating = 3;
            } else if (highest < 4) {
                rating = 4;
            }        
        }
        let roll = this._base_dice_roll(rating);
        if (roll.status == "critical") {
            results.push("Your plan of action was negated somehow as your objective slips through your fingers. If you want to insist on the same objective, you must change your method.");
        } else if (roll.highest == 1) {
            result = "Reduced Effect";
        } else if (roll.highest == 2) {
            result = "Worse Position";
        } else if (roll.highest == 3 || roll.highest == 4 || roll.highest ==5) {
            let complication_roll = u.rollD6();              
            let complications = {
                "serious": {
                    "1": "Lose 1 item for the rest of the score.",
                    "2": "Your objective is almost gone from your reach. In order to achieve it, you will have to use drastic tactics.",
                    "3": "Take +2 heat.",
                    "4": "Lose status with a faction.",
                    "5": "Cornered by a new threat.",
                    "6": "3 ticks on a new or existing clock."
                },
                "standard": {
                    "1": "Lose 1 marked item. You'll need an action roll to backtrack and retrieve it.",
                    "2": "Your objective is on the risk of not being achieved. The situation requires you to push harder to achieve it.",
                    "3": "Take +1 heat.",
                    "4": "Lose status with a faction.",
                    "5": "Introduce a new threat.",
                    "6": "2 ticks on a new or existing clock."
                },
                "minor": {
                    "1": "One of your marked items is somehow out of your reach. You may do a setup roll to retrieve it.",
                    "2": "Your objective is waylaid by a troublesome action or circumstance.",
                    "3": "1 tick on a new existing 2-segment clock for taking +1 heat.",
                    "4": "1 tick on a new or existing 2-segment clock for losing status with a faction.",
                    "5": "Telegraph a new threat.",
                    "6": "1 tick on a new of existing clock."                        
                }
            }
            result = `Complication: ${complications[complication][complication_roll]}`;
        } else {
            let harm_text = " Harm";
            if (position == "risky") {
                harm_text = "Moderate (2)" + harm_text;
            } else if (position == "desperate") {
                harm_text = "Severe (3)" + harm_text;                
            } else {
                harm_text = "Lesser (1)" + harm_text;                
            }
            result = harm_text;
        }
        return {
            "roll": roll,
            "result": result
        }
    }
    
    fortune(rating=1,advantages=0,disadvantages=0) {
        rating += advantages
        rating += disadvantages
        rating = Math.max(1,rating); // 1 for sheer dumb luck
        
        let roll = this._base_dice_roll(rating);
        let result = "";
        let effect = "";
        let position = "";
        let threat = "";
        
        if (roll.status == "critical") {
            result = "expectional";
            position = "controlled";
            effect = "great/extreme";
            threat = "legendary";
        } else if (roll.status == "full success") {
            result = "good";
            position = "controlled";
            effect = "standard/full";
            threat = "challenging";
        } else if (roll.status == "partial success") {
            result = "mixed";
            position = "risky";
            effect = "limited/partial";
            threat = "standard";
        } else {
            result = "poor";
            position = "desperate";
            effect = "little";
            threat = "standard";            
        }
        
        return {
            "roll": roll,
            "result": result,
            "position": position,            
            "effect": effect,
            "threat": threat
        }
    }
    
    npcReaction(attitude="Neutral") {
        let rating = 0;
        if (attitude == "Hostile") {
            rating = 0;
        } else if (attitude == "Neutral") {
            rating = 1;        
        } else {
            //"Friendly"
            rating = 2;            
        }
        
        return this.fortune(rating)
    }
    
    resist(rating=0) {
        // setup our roll result
        let stress = 6;
        let critical = false;
        let roll = this._base_dice_roll(rating);
        stress -= roll.highest;

        if (roll.status == "critical") {
            critical = true;
        }
        
        return {
            "roll": roll,
            "stress": stress,
            "critical": critical
        }
    }
}