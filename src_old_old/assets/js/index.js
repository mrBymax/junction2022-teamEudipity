// Create global userWalletAddress variable
window.userWalletAddress = null;

// when the browser is ready
window.onload = async (event) => {
  // check if ethereum extension is installed
  if (window.ethereum) {
    // create web3 instance
    let web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    window.web3 = new Web3(web3Provider);
    //window.web3 = new Web3(window.ethereum);
  } else {
    // prompt user to install Metamask
    alert("Please install MetaMask or any Ethereum Extension Wallet");
  }

  // check if user is already logged in and update the global userWalletAddress variable
  window.userWalletAddress = window.localStorage.getItem("userWalletAddress");

  // show the user dashboard
  showUserDashboard();
};

function animateButton(){
    $(".login-btn span").addClass("animated");
}
function deanimateButton(){
    $(".login-btn span").removeClass("animated");
}

// Web3 login function
const loginWithEth = async () => {
    animateButton();
  // check if there is global window.web3 instance
  if (window.web3) {
    try {
      // get the user's ethereum account - prompts metamask to login
      const selectedAccount = await window.ethereum
        .request({
          method: "eth_requestAccounts",
        })
        .then((accounts) => accounts[0])
        .catch(() => {
          // if the user cancels the login prompt
          throw Error("Please select an account");
        });

      // set the global userWalletAddress variable to selected account
      window.userWalletAddress = selectedAccount;

      // store the user's wallet address in local storage
      window.localStorage.setItem("userWalletAddress", selectedAccount);

      // show the user dashboard
      
    } catch (error) {
      alert(error);
      deanimateButton();
    }
  } else {
    alert("wallet not found");
    deanimateButton();
  }

};

// function to show the user dashboard
const showUserDashboard = async () => {
  // if the user is not logged in - userWalletAddress is null
  if (!window.userWalletAddress) {
    // change the page title
    document.title = "Web3 Login";

    // show the login section
    $(".login-box").fadeIn();

    // hide the user dashboard section
    $(".dashboard-section").fadeOut();

    // return from the function
    return false;
  }

  // change the page title
  document.title = "Web3 Dashboard";

  // hide the login section
  $(".login-box").fadeOut();

  // show the dashboard section
  $(".dashboard-section").fadeIn();

  // show the user's wallet address
  showUserWalletAddress();

  // get the user's wallet balance
  getWalletBalance();

  loadPartiesList();
};

// show the user's wallet address from the global userWalletAddress variable
const showUserWalletAddress = () => {
  const walletAddressEl = document.querySelector(".wallet-address");
  walletAddressEl.innerHTML = window.userWalletAddress;
};

// get the user's wallet balance
const getWalletBalance = async () => {
  // check if there is global userWalletAddress variable
  if (!window.userWalletAddress) {
    return false;
  }

  // get the user's wallet balance
  const balance = await window.web3.eth.getBalance(window.userWalletAddress);

  // convert the balance to ether
  document.querySelector(".wallet-balance").innerHTML = web3.utils.fromWei(
    balance,
    "ether"
  );
};

// web3 logout function
const logout = () => {
  // set the global userWalletAddress variable to null
  window.userWalletAddress = null;

  // remove the user's wallet address from local storage
  window.localStorage.removeItem("userWalletAddress");

  // show the user dashboard
  showUserDashboard();
};

// when the user clicks the login button run the loginWithEth function
document.querySelector(".login-btn").addEventListener("click", loginWithEth);

// when the user clicks the logout button run the logout function
document.querySelector(".logout-btn").addEventListener("click", logout);

var transend       = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
    animated_class = 'animated';

function staggerSlide() {
  var $feature = $(this).closest('.feature');

  $feature
    .children('.features-list')
    .children('.features-list__item')
    .addClass(animated_class);

  $feature.next().addClass(animated_class);
}

function activateStagger() {
  $('.feature:first').addClass(animated_class);
  $('.list-title').on(transend, staggerSlide);
}

// $(window).on('load', activateStagger);

function loadPartiesList(){
  // Load the contract
  $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      let ElectionContract = TruffleContract(election);
      let electionInstance;
      // Connect provider to interact with contract
      ElectionContract.setProvider(window.web3);

      ElectionContract.deployed().then((instance) => {
        debugger;
        electionInstance = instance;
        return electionInstance.candidatesCount();
      }).then(function (candidatesCount) {
        var listContent = [];
        debugger;
        for (var i = 1; i <= candidatesCount; i++) {
            electionInstance.candidates(i).then(function (candidate) {
                var id = candidate[0];
                var name = candidate[1];
                var voteCount = candidate[2];

                listContent.push(document.createElement("li"));
                listContent[i].style = "display: none";
                listContent[i].innerHTML = `<input type="radio" value="${name}" id="${id}" name="chosen_party" /> <label for="${id}">${name}</label>`;
                
                /*
                // Render candidate Result
                var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
                candidatesResults.append(candidateTemplate);
                // Render candidate ballot option
                var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
                candidatesSelect.append(candidateOption);*/

                if(i == candidatesCount){
                  // complete loading
                  showUserDashboard();
                  deanimateButton();

                  $(".parties .parties-list").append(listContent);
                  $('.parties .parties-list li').each(function(){
                      var elem = $(this);
                      setTimeout(function(){
                      elem.show(200);
                      }, 100 * elem.index());
                  });
                }
            });
        }

        

        return electionInstance.voters(App.account);
    }).then(function (hasVoted) {
        // Do not allow a user to vote
        if (hasVoted) {
          alert("BRO HAI GIA VOTATO");
          $("input").prop("disabled", true);
        }
    }).catch(function (error) {
        console.warn(error);
    });

    });
}

$(document).on("click", "li", (e) => {
    $(e.target).find("input").click()
})