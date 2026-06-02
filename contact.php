<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Contact ACI Auto Body</title>
    <meta name="description" content="Contact ACI Auto Body via the API endpoint.">
    <link rel="stylesheet" type="text/css" media="screen" href="css/reset.css">
    <link rel="stylesheet" type="text/css" media="screen" href="css/style.css">
    <style>
      .contact-form-wrapper { max-width: 760px; margin: 30px auto; padding: 24px; background: #fff; border-radius: 10px; box-shadow: 0 12px 28px rgba(0,0,0,.08); }
      .contact-form-wrapper h2 { margin-top: 0; font-size: 30px; }
      .contact-form-wrapper p { color: #444; line-height: 1.6; }
      .contact-form-row { margin-bottom: 18px; }
      .contact-form-row label { display: block; margin-bottom: 6px; font-weight: bold; }
      .contact-form-row input[type=text], .contact-form-row input[type=email], .contact-form-row textarea { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; }
      .contact-form-row textarea { min-height: 150px; resize: vertical; }
      .contact-form-submit { display: inline-block; background: #0073e6; color: #fff; padding: 14px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; text-decoration: none; }
      .contact-form-submit:hover { background: #005ab8; }
      .contact-form-note { color: #5d5d5d; font-size: 14px; margin-top: 14px; }
      .contact-endpoint { font-size: 13px; color: #666; word-break: break-word; }
    </style>
</head>
<body>
<div class="bg">
   <header>
       <div class="main wrap">
            <h1><a href="index.php"><img src="images/ACI.logo.png" alt="ACI Auto Body Shop"></a></h1>
            <p>6655 Dobbin Rd. Suite H<br> Columbia, MD 21045 <span>410-799-2000</span></p>
       </div>
       <nav>
          <ul class="menu">
              <li><a href="index.php" class="home"><img src="images/home.jpg" alt="Home"></a></li>
              <li><a href="about.php">About</a></li>
              <li><a href="collision.php">Collision</a></li>
              <li><a href="mechanical.php">Mechanical</a></li>
              <li><a href="photos.php">Photos</a></li>
              <li><a href="locations.php">Locations</a></li>
              <li><a href="contact.php">Contact</a></li>
              <li><a href="employment.php">Employment</a></li>
          </ul>
          <div class="clear"></div>
        </nav>
   </header>
   <section id="content"><div class="ic"></div>
      <div class="sub-page">
        <div class="sub-page-left">
          <div class="wrap">
            <div class="contact-form-wrapper">
              <h2>Contact Us</h2>
              <p>Use this form to send a lead directly to the API endpoint through your Cloudflare tunnel.</p>
              <form method="POST" action="https://api.mdaci.com/leads/contact">
                <div class="contact-form-row">
                  <label for="name">Full Name *</label>
                  <input type="text" id="name" name="name" required>
                </div>
                <div class="contact-form-row">
                  <label for="email">Email Address *</label>
                  <input type="email" id="email" name="email" required>
                </div>
                <div class="contact-form-row">
                  <label for="phone_number">Phone Number</label>
                  <input type="text" id="phone_number" name="phone_number">
                </div>
                <div class="contact-form-row">
                  <label for="message">Message *</label>
                  <textarea id="message" name="message" required></textarea>
                </div>
                <input type="hidden" name="redirect_to" value="<?php echo htmlspecialchars((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']); ?>">
                <input type="hidden" name="token" value="REPLACE_WITH_YOUR_FORM_TOKEN">
                <button type="submit" class="contact-form-submit">Send Message</button>
              </form>
              <p class="contact-form-note">If you want to test the tunnel, submit the form and check your Node app logs or DB for the new lead.</p>
              <p class="contact-endpoint"><strong>Endpoint:</strong> https://api.mdaci.com/leads/contact</p>
              <p class="contact-form-note">Replace <code>REPLACE_WITH_YOUR_FORM_TOKEN</code> with your actual lead form token from the admin settings.</p>
            </div>
          </div>
        </div>
      </div>
   </section>
  <footer>&copy; 1987-2026 ACI Auto Body Shop</footer>
</div>
</body>
</html>
