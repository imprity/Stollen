# Stollen

*it's like [pollen](https://git.matthewbutterick.com/mbutterick/pollen) but stolen (and bad)*

It's a simple markup langage that can be compiled(?) to tree of javascript object.

# Basic Usage

```javascript
const st = require('stollen');

let text = 
`{|h1}[Hello World|]

{|div}[
    {|em}[Hi buddy!|]
    Sup~
|]

Goodbye World!
`

let [root, errorMsg] = st.parse(text, '');


/*produces tree that looks like this

{
    "attributes": [],
    "body": [
        {
            "attributes": ["h1"],
            "body": ["Hello World"]
        },
        "\n\n",
        {
            "attributes": ["div"],
            "body": [
                {
                    "attributes": ["em"],
                    "body": ["Hi buddy!"]
                },
                "\nSup~"
            ]
        },
        "\n\nGoodbye World!"
    ]
}
*/
```

# Syntax
Syntax is like this

```
outer text
{| attribute1 attribute2 attribute3}[
    some text
    {|"child attribute 1" "child attribute 2"}[
        child text
    |]
    other text
|]
other outer text
```

And it will convert this file to javascript objects.

```javascript
//it also has a pointer to it's parent
//but I don't know describe circular relations with JSON
{
    "attributes": [],
    "body": [
        "outer text\n",
        {
            "attributes": [
                "attribute1",
                "attribute2",
                "attribute3"
            ],
            "body": [
                "some text\n",
                {
                    "attributes": [
                        "child attribute 1",
                        "child attribute 2"
                    ],
                    "body": [
                        "child text"
                    ]
                },
                "\nother text"
            ]
        },
        "\nother outer text"
    ]
}

```

# White Space

Stollen mostly tries to keep whitespaces intact, ***except indents.***

It is mainly to make the original stollen code more readable.

This is how it works.

Stollen checks how much the first line is indented. For example :
```
{|animals}[
    cat
    dog
|]
```
In this case first line cat starts with 4 spaces.
Stollen notices this and removes following lines 4 spaces.

But what about cases where you want to start the text with tab or spaces?

In those cases, you can start your text with `|` and then insert whitespaces.

```
{|div}[
    |    This scentence starts after 4 spaces.
    |  And this starts after 2 spaces
|]
```

Stollen always ignore first `|` after indent in multi-line text.

If you want to start your multi-line text with `|`, just put it two times   
(sorry but it was the best I could come up with)

# Escaping

Escape character is `@`. To type `@`, insert `@@`.

You only need to escape characters that are important in that context.

```
you always have to escpae
@@

in most outer body, you only need to escpae
@{| @|]

{|
    in attributes you only need to escape
    @} @"
}
[
    same as most outer body, you only need to escpae
    @{| @|]
|]
```

# TODO

* a way to add comment
* rigorous testing
* better code