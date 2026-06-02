<?php
$apiEndpoint = 'https://api.mdaci.com/leads/contact';
$formToken = getenv('LEAD_FORM_TOKEN') ?: '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Auto Body Shop near Savage MD Call 410-799-2000</title>
    <meta name="description" content="ACI Auto Body Paint Jobs and Auto Collision Center Call 410-799-2000 Columbia MD .">
    <meta name="keywords" content="elkridge auto body shop, columbia autobody, columbia auto body, columbia auto body shop, autobody 21045, auto body 21044, body shop columbia md, columbia collision center, auto body shop near me, auto body shop near columbia MD, ellicott city auto body, savage auto body, jessup auto body shop, elkridge auto body shops,severn Auto body Shop, howard county auto body, car body repair, car body shop, columbia collision repair, auto collision, columbia car painting, jessup auto paint job, laurel auto body, auto body painting, car paint 21045, dent repair 21044, paintless dent repair, car scratch repair, car dent repair 21046, car dent removal, auto body shop 21045,columbia auto body shop, maryland auto collision shops, md autobody repairs, baltimore auto repair, jessup auto collision shop, laurel auto paint shop, beltsville collision center, college park auto body shop, auto paint shop MD 20794, car paint Maryland 21044, automobile paint shops md 20707, 20723, auto collision insurance, auto paint jobs, Gieco auto body shop, auto body shop free estimates, all state auto body shop, progressive auto body shop, auto body shop howard county MD, auto body shop 21046, auto body shop in Columbia MD, auto body shop near columbia MD">
    <link rel="stylesheet" type="text/css" media="screen" href="css/reset.css">
    <link rel="stylesheet" type="text/css" media="screen" href="css/style.css">
    <link href='http://fonts.googleapis.com/css?family=Open+Sans+Condensed:700,300' rel='stylesheet' type='text/css'>
    <script src="js/jquery-1.7.min.js"></script>
    <script src="js/jquery.easing.1.3.js"></script>
    <style>
      .contact-api-form { max-width: 100%; width: 100%; margin: 0 auto; }
      .contact-api-form .form-group { margin-bottom: 16px; }
      .contact-api-form label { display: block; margin-bottom: 6px; font-weight: bold; }
      .contact-api-form input[type=text], .contact-api-form input[type=email], .contact-api-form textarea { width: 100%; border: 1px solid #ccc; border-radius: 6px; padding: 12px; font-size: 14px; }
      .contact-api-form textarea { min-height: 140px; resize: vertical; }
      .contact-api-form button { background: #0073e6; color: #fff; border: none; border-radius: 6px; padding: 14px 20px; cursor: pointer; font-size: 16px; }
      .contact-api-form button:hover { background: #005bb5; }
      .contact-api-alert { display: none; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 14px; }
      .contact-api-alert.success { background: #e6f4ea; border: 1px solid #b6dfc2; color: #1f5f38; }
      .contact-api-alert.error { background: #fde8e8; border: 1px solid #f3c2c2; color: #8a1b1b; }
      .contact-api-meta { color: #555; font-size: 13px; margin-top: 12px; }
    </style>
</head>
<body>
<div class="bg">
   <header>
       <div class="main wrap">
            <h1><a href="index.php"><img src="images/ACI.logo.png" alt="ACI Auto Body Shop columbia MD,auto body ellicott city MD,body shop severn MD,auto collision savage MD,auto painting laurel MD, auto body shop Jessup MD, auto body Laurel MD,auto body Elkridge MD,columbia auto body 21045, "></a></h1>
            <p>6655 Dobbin Rd. Suite H<br> Columbia, MD 21045 <span>410-799-2000</span></p>
       </div>
       <nav>
          <ul class="menu">
              <li><a href="index.php" class="home"><img src="images/home.jpg" alt="Columbia Mechanical Service"></a></li>
              <li><a href="about.php" title="Mazda 3,6,CX-3, CX-5, CX-9, MX-5 ,CX-30, CX-50, CX-90, Miata, MX-30 EV" alt="About Us">About</a></li>
              <li><a href="collision.php" title="Corvette, Silverado, Tahoe, S-10, Stingray, SS, Z28, RS, Yukon," alt="Insurance Collision Repair">Collision</a></li>
              <li><a href="mechanical.php" title="Tesla, Plaid, Model 3, Model Y, Model S, Model X, Electric, EV, Hybrid" alt="Vehicle Service">Mechanical</a></li>
              <li><a href="photos.php" title="Before and After Photos, Mercedes, BMW, Lexus, Dodge, Chrysler, Jeep, Fiat">Photos</a></li>
              <li><a href="locations.php" alt="Alignment, Frame Pull, Engine Swap, Transmission, Trans Sawp, Spoiler Install">Locations</a></li>
              <li><a href="contact.php" title="Send us a message" alt="ECM, PCM, ABS, SRS, XM, AM, FM">Contact</a></li>
              <li><a href="employment.php" title="Work for us!!!!" alt="Experianced repair tech">Employment</a></li>
              <li><a href="http://www.yelp.com/biz/automotive-and-collision-center-inc-columbia" title="Our Yelp Profile" target="new"><img src="data:image/png;base64,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%3D%3D" alt="Toyota Camry, Corolla, Prius, Rav4, 4Runner, Tundra Repair Deer Hit" title="Acura Integra, TLX, RLX, TL, RL, NSX"></a></li>
          </ul>
          <div class="clear"></div>
        </nav>
   </header>
        <script>
      window.fbAsyncInit = function() {
        FB.init({
          appId      : 'your-app-id',
          xfbml      : true,
          version    : 'v2.1'
        });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s); js.id = id;
         js.src = "//connect.facebook.net/en_US/sdk.js";
         fjs.parentNode.insertBefore(js, fjs);
       }(document, "script", "facebook-jssdk"));
    </script>   </br>   <!--==============================content================================-->
   <section id="content"><div class="ic"></div>
      <div class="sub-page">
        <div class="sub-page-left">
            <div class="wrap">
                <div class="extra-wrap" style="text-align: center;">
                    <div class="contact-api-form">
                      <div id="contact-alert" class="contact-api-alert" role="alert"></div>
                      <h2 class="p2">Contact Us</h2>
                      <p>Send us a message and our team will follow up as soon as possible.</p>
                      <form id="contact-form">
                        <div class="form-group">
                          <label for="contact-name">Full Name *</label>
                          <input type="text" id="contact-name" name="name" required>
                        </div>
                        <div class="form-group">
                          <label for="contact-email">Email Address *</label>
                          <input type="email" id="contact-email" name="email" required>
                        </div>
                        <div class="form-group">
                          <label for="contact-phone">Phone Number</label>
                          <input type="text" id="contact-phone" name="phone_number">
                        </div>
                        <div class="form-group">
                          <label for="contact-message">Message *</label>
                          <textarea id="contact-message" name="message" required></textarea>
                        </div>
                        <input type="hidden" id="lead-form-token" value="<?= htmlspecialchars($formToken, ENT_QUOTES) ?>">
                        <button type="submit">Send Message</button>
                      </form>
                      <p class="contact-api-meta"><strong>API endpoint:</strong> <?= htmlspecialchars($apiEndpoint, ENT_QUOTES) ?></p>
                    </div>
                </div>
            </div>
        </div>
        <div class="sub-page-right">
          <div class="shadow bot-1">
                <h2 class="p2">Customer</h2>
                <p class="text-3 p2">Reviews</p>
                            <div class="comments">
                <div>“When I got my car back I couldn't even tell where I was hit”
                  <div class="comments-corner">- Carrie Nyugen</div>
                </div>
              </div>
            </div>
            <div class="box-5">
                <h2 class="p2">Specialization</h2>
                <img src="images/page2-img5.jpg" alt="">
                <ul class="list-1">
                    <li><a href="collision.php">Complete Collision Service </a></li>
                    <li><a href="collision.php">Frame Straightening</a></li>
                    <li><a href="collision.php">Insurance Repairs Shop</a></li>
                    <li><a href="mechanical.php">Mechanical Service</a></li>
                    <li><a href="mechanical.php">Glass Replacement</a></li>
                </ul>
            </div>
        </div>
      </div>
   </section>
  <footer>&copy; 1987-2026 ACI Auto Body Shop</footer>
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-116562854-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-116562854-1');
</script>
<script>
  const apiEndpoint = '<?= htmlspecialchars($apiEndpoint, ENT_QUOTES) ?>';
  const formToken = document.getElementById('lead-form-token').value;
  const alertBox = document.getElementById('contact-alert');
  const form = document.getElementById('contact-form');

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `contact-api-alert ${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }

  async function submitContactForm(event) {
    event.preventDefault();
    hideAlert();

    const payload = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      phone_number: document.getElementById('contact-phone').value.trim(),
      message: document.getElementById('contact-message').value.trim(),
      token: formToken || undefined
    };

    if (!payload.name || !payload.email || !payload.message) {
      showAlert('Please provide your name, email address, and a message.', 'error');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (formToken) {
        headers['x-lead-form-token'] = formToken;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorText = `Unable to send message (${response.status})`;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          errorText = data.error || errorText;
        } else {
          const text = await response.text();
          if (text) {
            const trimmed = text.trim();
            if (trimmed.length < 300) {
              errorText = trimmed;
            }
          }
        }
        throw new Error(errorText);
      }

      showAlert('Thank you! Your message has been sent successfully.', 'success');
      form.reset();
    } catch (error) {
      console.error('Contact form submission error:', error);
      showAlert(error.message || 'There was a problem sending your message. Please try again later.', 'error');
    }
  }

  form.addEventListener('submit', submitContactForm);
</script>
</div>
</body>
</html>
