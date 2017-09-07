'use strict';

import React, {
  Component,
  PropTypes,
} from 'react';

import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  ListView,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableHighlight,
  Modal,
  ActivityIndicator,
} from 'react-native';

let dimensions = Dimensions.get('window');
const windowWidth = dimensions.width;
const windowHeight = dimensions.height;

const TOUCHABLE_ELEMENTS = ['TouchableHighlight', 'TouchableOpacity', 'TouchableWithoutFeedback', 'TouchableNativeFeedback'];
/**
 * modify from network
 * Api： https://github.com/sohobloo/react-native-modal-dropdown
 * 二级联动： linkage = true , options 格式为：{key:1, value:'value', items:[{key:1, value:'value'},{key:1, value:'value'}]}
 */
export default class DropdownLinkage extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    defaultIndex: PropTypes.number,
    defaultValue: PropTypes.string,
    options: PropTypes.array,

    accessible: PropTypes.bool,
    animated: PropTypes.bool,
    showsVerticalScrollIndicator: PropTypes.bool,
    keyboardShouldPersistTaps: PropTypes.oneOf(['always', 'never', 'handled', false, true]),

    style: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    textStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    dropdownStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    dropdownTextStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    dropdownTextHighlightStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),

    adjustFrame: PropTypes.func,
    renderRow: PropTypes.func,
    renderTitle: PropTypes.func,
    renderSeparator: PropTypes.func,

    onDropdownWillShow: PropTypes.func,
    onDropdownWillHide: PropTypes.func,
    onSelect: PropTypes.func
  };

  static defaultProps = {
    disabled: false,
    defaultIndex: -1,
    defaultValue: '请选择...',
    options: null,
    animated: true,
    showsVerticalScrollIndicator: true,
    keyboardShouldPersistTaps: 'never'
  };

  constructor(props) {
    super(props);

    this._button = null;
    this._buttonFrame = null;
    this._nextValue = null;
    this._nextIndex = null;

    this.state = {
      disabled: props.disabled,
      accessible: !!props.accessible,
      loading: props.options === null || props.options === undefined,
      showDropdown: false,
      buttonText: props.defaultValue,
      selectedIndex: props.defaultIndex,
      selectData: props.options[0],
    };
  }

  componentWillReceiveProps(nextProps) {
    let { selectData } = this.state;
    var buttonText = this._nextValue == null ? this.state.buttonText : this._nextValue.toString();
    var selectedIndex = this._nextIndex == null ? this.state.selectedIndex : this._nextIndex;
    var s;
    if(this.state.selectData == null ){
      s = nextProps.options[0]
    }else{
      s = selectData;
    }
    if (selectedIndex < 0) {
      selectedIndex = nextProps.defaultIndex;
      if (selectedIndex < 0) {
        buttonText = nextProps.defaultValue;
      }
    }
    this._nextValue = null;
    this._nextIndex = null;

    this.setState({
      disabled: nextProps.disabled,
      loading: nextProps.options == null,
      buttonText: buttonText,
      selectedIndex: selectedIndex,
      selectData: s,
    });
  }

  render() {
    return (
      <View {...this.props}>
        {this._renderButton()}
        {this._renderModal()}
      </View>
    );
  }

  _updatePosition(callback) {
    if (this._button && this._button.measure) {
      this._button.measure((fx, fy, width, height, px, py) => {
        this._buttonFrame = {x: px, y: py, w: width, h: height};
        callback && callback();
      });
    }
  }

  show() {
    this._updatePosition(() => {
      this.setState({
        showDropdown: true
      });
    });
  }

  hide() {
    this.setState({
      showDropdown: false
    });
  }

  select(idx) {
    var value = this.props.defaultValue;
    if (idx == null || this.props.options == null || idx >= this.props.options.length) {
      idx = this.props.defaultIndex;
    }

    if (idx >= 0) {
      value = this.props.options[idx].toString();
    }

    this._nextValue = value;
    this._nextIndex = idx;

    this.setState({
      buttonText: value,
      selectedIndex: idx
    });
  }

  _renderButton() {
    let { renderTitle } = this.props;
    let { buttonText } = this.state;
    let title = !renderTitle ?
    (
      <View style={styles.button}>
        <Text style={[styles.buttonText, this.props.textStyle]}
              numberOfLines={1}>
          {buttonText}
        </Text>
      </View>
    )
    : renderTitle(buttonText)
    return (
      <TouchableOpacity ref={button => this._button = button}
                        disabled={this.props.disabled}
                        accessible={this.props.accessible}
                        onPress={this._onButtonPress.bind(this)}>
        { this.props.children || title }
      </TouchableOpacity>
    );
  }

  _onButtonPress() {
    if (!this.props.onDropdownWillShow ||
      this.props.onDropdownWillShow() !== false) {
      this.show();
    }
  }

  _renderModal() {
    if (this.state.showDropdown && this._buttonFrame) {
      let frameStyle = this._calcPosition();
      // let animationType = this.props.animated ? 'fade' : 'none';
      let animationType = 'none';
      return (
        <Modal animationType={animationType}
               transparent={true}
               onRequestClose={this._onRequestClose.bind(this)}
               supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}>
          <TouchableWithoutFeedback accessible={this.props.accessible}
                                    disabled={!this.state.showDropdown}
                                    onPress={this._onModalPress.bind(this)}>
            <View style={styles.modal}>
              <View style={[styles.dropdown, this.props.dropdownStyle, frameStyle]}>
                {this.state.loading ? this._renderLoading() : this._renderDropdown()}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
  }

  _calcPosition() {

    let dropdownHeight = (this.props.dropdownStyle && StyleSheet.flatten(this.props.dropdownStyle).height) ||
      StyleSheet.flatten(styles.dropdown).height;

    let bottomSpace = windowHeight - this._buttonFrame.y - this._buttonFrame.h;
    let rightSpace = windowWidth - this._buttonFrame.x;
    let showInBottom = bottomSpace >= dropdownHeight || bottomSpace >= this._buttonFrame.y;
    let showInLeft = rightSpace >= this._buttonFrame.x;

    var style = {
      height: dropdownHeight,
      top: showInBottom ? this._buttonFrame.y + this._buttonFrame.h : Math.max(0, this._buttonFrame.y - dropdownHeight),
    };

    if (showInLeft) {
      style.left = this._buttonFrame.x;
    } else {
      let dropdownWidth = (this.props.dropdownStyle && StyleSheet.flatten(this.props.dropdownStyle).width) ||
        (this.props.style && StyleSheet.flatten(this.props.style).width) || -1;
      if (dropdownWidth !== -1) {
        style.width = dropdownWidth;
      }
      style.right = rightSpace - this._buttonFrame.w;
    }

    if (this.props.adjustFrame) {
      style = this.props.adjustFrame(style) || style;
    }
    if( this.props.dropdownStyle && windowWidth == StyleSheet.flatten(this.props.dropdownStyle).width){
      style.left = 0;
      style.right = 0;
    }
    return style;
  }

  _onRequestClose() {
    if (!this.props.onDropdownWillHide ||
      this.props.onDropdownWillHide() !== false) {
      this.hide();
    }
  }

  _onModalPress() {
    if (!this.props.onDropdownWillHide ||
      this.props.onDropdownWillHide() !== false) {
      this.hide();
    }
  }

  _renderLoading() {
    return (
      <ActivityIndicator size='small'/>
    );
  }

  _renderDropdown() {
    let { options } = this.props;
    let { selectData } = this.state;
    let itemsChild = [];
    if(selectData ){
      let { items } = selectData;
      if(items)
        itemsChild = items;
    }
    return (
      <View style={{ flexDirection:'row' }}>
        <ListView style={{width: windowWidth/4}}
                  dataSource={this._getDataSource(options)}
                  renderRow={this._renderLeftRow.bind(this)}
                  automaticallyAdjustContentInsets={false}
                  showsVerticalScrollIndicator={this.props.showsVerticalScrollIndicator}
                  keyboardShouldPersistTaps={this.props.keyboardShouldPersistTaps}
        />
        <ListView style={{width: (windowWidth/4)*3, borderLeftWidth:0.5, borderColor:'#dbdbdb'}}
                  dataSource={this._getDataSource(itemsChild)}
                  renderRow={this._renderRow.bind(this)}
                  automaticallyAdjustContentInsets={false}
                  showsVerticalScrollIndicator={this.props.showsVerticalScrollIndicator}
                  keyboardShouldPersistTaps={this.props.keyboardShouldPersistTaps}
        />
      </View>
    );
  }

  _getDataSource( datas ) {
    let ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    return ds.cloneWithRows(datas);
  }
  _renderLeftRow(rowData, sectionID, rowID, highlightRow) {
    let{ key, value } = rowData;
    let { selectData } = this.state;
    let highlighted = key == selectData.key;
    return (
      <TouchableOpacity onPress={() =>{ this.setState({ selectData:rowData })} }>
        <Text style={[
          styles.rowText,
          this.props.dropdownLeftTextStyle,
          highlighted && styles.leftHighlightedRowText,
        ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  }
  _renderRow(rowData, sectionID, rowID, highlightRow) {
    let{ key, value } = rowData;
    //let key = `row_${rowID}`;
    let highlighted = key == this.state.selectedIndex;
    let row = !this.props.renderRow ?
      (<Text style={[
        styles.rowText,
        this.props.dropdownTextStyle,
        highlighted && styles.highlightedRowText,
        highlighted && this.props.dropdownTextHighlightStyle
      ]}
      >
        {value}
      </Text>) :
      this.props.renderRow(value, key, highlighted);
    let preservedProps = {
      key: key,
      accessible: this.props.accessible,
      onPress: () => this._onRowPress(value, sectionID, key, highlightRow),
    };
    return (
      <TouchableOpacity {...preservedProps}>
        {row}
      </TouchableOpacity>
    );
  }

  _onRowPress(rowData, sectionID, rowID, highlightRow) {
    if (!this.props.onDropdownWillHide ||
      this.props.onDropdownWillHide() !== false) {
      this.setState({
        showDropdown: false
      });
    }
    if (!this.props.onSelect ||
      this.props.onSelect(rowID, rowData) !== false) {
      highlightRow(sectionID, rowID);
      this._nextValue = rowData;
      this._nextIndex = rowID;
      this.setState({
        buttonText: rowData.toString(),
        selectedIndex: rowID
      });
    }
  }

  _renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
    let key = `spr_${rowID}`;
    return (<View style={styles.separator}
                  key={key}
    />);
  }
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 12
  },
  modal: {
    flexGrow: 1
  },
  dropdown: {
    position: 'absolute',
    // height: (33 + StyleSheet.hairlineWidth) * 5,
    maxHeight: Dimensions.get('window').height/2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgray',
    borderRadius: 2,
    backgroundColor: 'white',
    justifyContent: 'center'
  },
  loading: {
    alignSelf: 'center'
  },
  list: {
    //flexGrow: 1,
  },
  rowText: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    fontSize: 14,
    color: '#323232',
    backgroundColor: 'white',
    textAlignVertical: 'center'
  },
  highlightedRowText: {
    color: '#34a5f0'
  },
  leftHighlightedRowText:{
    color:'#323232',
    backgroundColor:'#f0f0f0',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'lightgray'
  }
});