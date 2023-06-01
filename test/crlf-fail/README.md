This is the place where test program puts failed test outputs when testcase has crlf line ending instead of lf line ending.

It checks this by

1. converts test case to have clrf line ending
2. feeds the test case to parser
3. compare this with expected result text that lf replaced with crlf

Thought this was a good idea to do this because I wanted stollen to work with documents with any line endings (yes, even with mixed line endings).