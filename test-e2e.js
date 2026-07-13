const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function testFlow() {
  console.log("=== STARTING E2E TEST ===");

  const timestamp = Date.now();
  const citizenEmail = `citizen_${timestamp}@test.com`;
  const bhangariEmail = `bhangari_${timestamp}@test.com`;
  const creatorEmail = `creator_${timestamp}@test.com`;
  
  let citizenCookie, bhangariCookie, creatorCookie;
  let listingId;

  const getCookie = (res) => {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return null;
    return setCookie.split(';')[0];
  };

  try {
    console.log("\\n1. Identity Management - Registering Citizen");
    let res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Citizen', email: citizenEmail, password: 'password123', role: 'Citizen' })
    });
    let data = await res.json();
    if (!res.ok) throw new Error('Citizen register failed: ' + JSON.stringify(data));
    citizenCookie = getCookie(res);
    console.log("Citizen registered successfully");

    console.log("\\n2. Citizen Scrap Upload System - Creating Listing");
    const dummyImgPath = path.join(__dirname, 'dummy.jpg');
    fs.writeFileSync(dummyImgPath, 'dummy image content');
    const imgBuffer = fs.readFileSync(dummyImgPath);
    
    // Use native FormData and Blob
    const formData = new FormData();
    formData.append('category', 'Plastic');
    formData.append('weight', '5.5');
    // Using native File/Blob
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    formData.append('photo', blob, 'dummy.jpg');

    res = await fetch(`${BASE_URL}/api/scrap`, {
      method: 'POST',
      headers: { 'Cookie': citizenCookie },
      body: formData // native fetch handles Content-Type and boundary automatically
    });
    data = await res.json();
    if (!res.ok) throw new Error('Scrap listing failed: ' + JSON.stringify(data));
    console.log("Scrap listing created successfully. Data:", data);

    console.log("\\n3. Bhangari Buying Board - Registering Bhangari & Fetching Board");
    res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Bhangari', email: bhangariEmail, password: 'password123', role: 'BhangariShop' })
    });
    data = await res.json();
    if (!res.ok) throw new Error('Bhangari register failed: ' + JSON.stringify(data));
    bhangariCookie = getCookie(res);

    res = await fetch(`${BASE_URL}/api/bhangari/board`, {
      headers: { 'Cookie': bhangariCookie }
    });
    let boardData = await res.json();
    if (!res.ok) throw new Error('Bhangari board failed: ' + JSON.stringify(boardData));
    console.log(`Bhangari board fetched successfully. ${boardData.length} active listings found.`);
    listingId = boardData[0].listingId;

    console.log("\\n4. Raw Material Purchase Module - Registering Creator & Purchasing");
    res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Creator', email: creatorEmail, password: 'password123', role: 'Creator' })
    });
    data = await res.json();
    if (!res.ok) throw new Error('Creator register failed: ' + JSON.stringify(data));
    creatorCookie = getCookie(res);

    res = await fetch(`${BASE_URL}/api/creator/materials`, {
      headers: { 'Cookie': creatorCookie }
    });
    let materialsData = await res.json();
    if (!res.ok) throw new Error('Creator materials failed: ' + JSON.stringify(materialsData));
    console.log(`Creator materials fetched successfully. ${materialsData.length} available.`);

    console.log("Creator purchasing the listing ID:", listingId);
    res = await fetch(`${BASE_URL}/api/creator/purchase/${listingId}`, {
      method: 'POST',
      headers: { 'Cookie': creatorCookie }
    });
    data = await res.json();
    if (!res.ok) throw new Error('Creator purchase failed: ' + JSON.stringify(data));
    console.log("Creator purchase successful.");

    console.log("\\n5. Direct Product Listing Tool - Creator creating a craft");
    const craftForm = new FormData();
    craftForm.append('title', 'Upcycled Plastic Vase');
    craftForm.append('description', 'A beautiful vase made from recycled plastic.');
    craftForm.append('price', '25.00');
    craftForm.append('inventoryCount', '1');
    craftForm.append('storyNarrative', 'Found in the streets, transformed for your home.');
    craftForm.append('beforePhoto', blob, 'before.jpg');
    craftForm.append('afterPhoto', blob, 'after.jpg');

    res = await fetch(`${BASE_URL}/api/crafts`, {
      method: 'POST',
      headers: { 'Cookie': creatorCookie },
      body: craftForm
    });
    data = await res.json();
    if (!res.ok) throw new Error('Craft creation failed: ' + JSON.stringify(data));
    console.log("Craft created successfully. Data:", data);

    console.log("\\n6. Upcycled Crafts Retail Storefront - Verifying public visibility");
    res = await fetch(`${BASE_URL}/api/crafts`);
    let storefrontData = await res.json();
    if (!res.ok) throw new Error('Storefront fetch failed: ' + JSON.stringify(storefrontData));
    
    if (storefrontData.length > 0) {
      console.log(`Storefront fetch successful. ${storefrontData.length} crafts available.`);
      console.log("Latest craft:", storefrontData[0].title);
    } else {
      throw new Error("Storefront is empty but a craft was just created!");
    }

    if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);

    console.log("\\n=== ALL E2E TESTS PASSED SUCCESSFULLY ===");

  } catch (err) {
    console.error("\\n!!! TEST FAILED !!!");
    console.error(err.message);
  }
}

testFlow();
