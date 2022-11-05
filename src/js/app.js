App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    init: function () {
        animateButton();
        return App.initWeb3();
    },
    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            window.ethereum.enable();
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },
    castVote: function () {
        var candidateId = $('#candidatesSelect').val();
        App.contracts.Election.deployed().then(function (instance) {
            return instance.vote(candidateId, {from: App.account});
        }).then(function (result) {
            // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function (err) {
            console.error(err);
        });
    },
    initContract: function () {
        $.getJSON("Election.json", function (election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
            return App.render();
        });
    },
    render: function (anim=true) {
        deanimateButton();

        $(".login-box").fadeOut();

        // show the dashboard section
        $(".dashboard-section").fadeIn();
        
        var electionInstance;
        var loader = $("#loader");
        var content = $("#content");
        loader.show();
        content.hide();
        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $(".wallet-address").text(App.account);
            }
        });
        // Load contract data
        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidatesCount();
        }).then(function (candidatesCount) {
            $(".parties-list").empty();

            var candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();

            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function (candidate) {
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];
                    
                    let toAdd = document.createElement("li");
                    if(anim) toAdd.style = "display: none";
                    toAdd.innerHTML = `<input type="radio" value="${id}" name="chosen_party" /> ${name} (votes: ${voteCount})`;
                    
                    $(".parties-list").append(toAdd);
                    

                    if(i >= candidatesCount){
                        localStorage.setItem("walletLoaded", "1");
                        // complete loading
                        deanimateButton();

                        $(".login-box").fadeOut();

                        // show the dashboard section
                        $(".dashboard-section").fadeIn();
                        
                        if(anim){
                            $('.parties .parties-list li').each(function(){
                                var elem = $(this);
                                setTimeout(function(){
                                    elem.show(200);
                                }, 100 * elem.index());
                            });
                        }
                    }
                });
            }

            return electionInstance.voters(App.account);
        }).then(function (hasVoted) {
            // Do not allow a user to vote
            if (hasVoted) {
                $('.vote-btn').hide();
            }
            loader.hide();
            content.show();
        }).catch(function (error) {
            console.warn(error);
        });
    }
};


function animateButton(){
    $(".login-btn span").addClass("animated");
}
function deanimateButton(){
    $(".login-btn span").removeClass("animated");
}

$(function () {
    if(window.localStorage.getItem("walletLoaded") == "1") {
        App.init();
    }
    $(".login-btn").click(function () {
        App.init();
    });
});

$(document).on("click", "li", (e) => {
    $(e.target).find("input").prop("checked", true);
    $("li").removeClass("selected");
    $(e.target).addClass("selected");
})

$(".logout-btn").click(() => {
    $(".login-box").fadeIn();

    // show the dashboard section
    $(".dashboard-section").fadeOut();

    localStorage.setItem("walletLoaded", "0");
})

$(".vote-btn").click(() => {
    let whoToVote = document.querySelector('input[name="chosen_party"]:checked').value;
    
    App.contracts.Election.deployed().then(function (instance) {
        return instance.vote(whoToVote, {from: App.account});
    }).then(function (result) {
        App.render(false);
    }).catch(function (err) {
        console.error(err);
    });
})