import { FAQService } from './services/faq';

/**
 * Manual test script for FAQ Service
 */
function testFAQ() {
    console.log('--- Testing FAQ Service ---');

    const testQueries = [
        '谁是非本地申请人？',
        'GPA 1.67',
        '图书馆 开放时间',
        'SSOid 激活',
        'How many credits per semester?',
        'smoking rules'
    ];

    testQueries.forEach(query => {
        console.log(`\nQuery: "${query}"`);
        const results = FAQService.searchFAQs(query);
        if (results.length > 0) {
            console.log(`Found ${results.length} result(s):`);
            results.forEach((r, i) => {
                console.log(` [${i + 1}] Q: ${r.question_zh}`);
                console.log(`     A: ${r.answer_zh.substring(0, 100)}...`);
            });
        } else {
            console.log(' No results found.');
        }
    });

    console.log('\n--- Test Complete ---');
}

testFAQ();
